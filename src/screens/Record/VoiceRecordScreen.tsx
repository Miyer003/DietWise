import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Colors from '../../constants/Colors';
import { AIService, DietService } from '../../services/api';
import { NutritionAnalysisResult, MealType } from '../../types';

interface VoiceRecordScreenProps {
  navigation: any;
  route: {
    params: {
      mealType: MealType;
    };
  };
}

// 录音状态
type RecordingStatus = 'idle' | 'recording' | 'processing' | 'analyzing' | 'success' | 'error';

export default function VoiceRecordScreen({ navigation, route }: VoiceRecordScreenProps) {
  const { mealType } = route.params;
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<NutritionAnalysisResult | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 动画值
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 录音动画
  useEffect(() => {
    if (recordingStatus === 'recording') {
      // 脉冲动画
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // 波形动画
      waveAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1.5,
              duration: 400 + index * 100,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 400 + index * 100,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    } else {
      pulseAnim.setValue(1);
      waveAnims.forEach(anim => anim.setValue(1));
    }
  }, [recordingStatus]);

  // 清理
  useEffect(() => {
    return () => {
      stopRecording();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // 请求录音权限
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要权限', '请允许访问麦克风以使用语音功能');
        return false;
      }
      return true;
    } catch (error) {
      console.error('请求权限失败:', error);
      return false;
    }
  };

  // 开始录音
  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 创建录音实例
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setRecordingStatus('recording');
      setRecordingDuration(0);
      setTranscribedText('');
      setAnalysisResult(null);
      setErrorMessage('');

      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            // 最多录制60秒
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('开始录音失败:', error);
      setErrorMessage('开始录音失败');
      setRecordingStatus('error');
    }
  };

  // 停止录音
  const stopRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (!recording) return;

    try {
      setRecordingStatus('processing');
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await processAudio(uri);
      } else {
        throw new Error('录音文件获取失败');
      }
    } catch (error) {
      console.error('停止录音失败:', error);
      setErrorMessage('处理录音失败');
      setRecordingStatus('error');
    }
  };

  // 处理音频（转文字并分析）
  const processAudio = async (audioUri: string) => {
    try {
      // 读取音频文件为 base64
      const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 调用后端语音识别和分析接口
      const response = await AIService.analyzeVoice({
        audioBase64: base64Audio,
        mimeType: Platform.OS === 'ios' ? 'audio/wav' : 'audio/m4a',
      });

      if (response.code === 0 && response.data) {
        setTranscribedText(response.data.transcribedText || '');
        if (response.data.analysisResult) {
          setAnalysisResult(response.data.analysisResult);
          setQuantity(response.data.analysisResult.quantityG || 100);
        }
        // 如果是猜测结果，显示提示
        if (response.data.isGuessed) {
          setErrorMessage('语音识别未成功，已根据音频特征智能猜测食物');
        }
        setRecordingStatus('success');
      } else {
        throw new Error(response.message || '识别失败');
      }
    } catch (error: any) {
      console.error('语音处理失败:', error);
      setErrorMessage(error.message || '语音识别失败，请重试');
      setRecordingStatus('error');
    }
  };

  // 重新录制
  const retakeRecording = () => {
    setRecordingStatus('idle');
    setTranscribedText('');
    setAnalysisResult(null);
    setRecordingDuration(0);
    setErrorMessage('');
  };

  // 计算实际营养值
  const calculateNutrition = () => {
    if (!analysisResult) return null;
    const ratio = quantity / (analysisResult.quantityG || 100);
    return {
      calories: Math.round(analysisResult.calories * ratio),
      protein: Math.round(analysisResult.proteinG * ratio * 10) / 10,
      carbs: Math.round(analysisResult.carbsG * ratio * 10) / 10,
      fat: Math.round(analysisResult.fatG * ratio * 10) / 10,
      fiber: Math.round((analysisResult.fiberG || 0) * ratio * 10) / 10,
      sodium: Math.round((analysisResult.sodiumMg || 0) * ratio),
    };
  };

  // 保存记录
  const saveRecord = async () => {
    if (!analysisResult) return;

    const nutrition = calculateNutrition();
    if (!nutrition) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await DietService.createRecord({
        recordDate: today,
        mealType: mealType,
        inputMethod: 'voice',
        items: [
          {
            foodName: analysisResult.foodName,
            quantityG: quantity,
            calories: nutrition.calories,
            proteinG: nutrition.protein,
            carbsG: nutrition.carbs,
            fatG: nutrition.fat,
            fiberG: nutrition.fiber,
            sodiumMg: nutrition.sodium,
            aiConfidence: analysisResult.confidence,
          },
        ],
      });

      if (response.code === 0) {
        Alert.alert('成功', '记录已保存', [
          {
            text: '继续添加',
            onPress: retakeRecording,
          },
          {
            text: '返回',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]);
      } else {
        throw new Error(response.message || '保存失败');
      }
    } catch (error: any) {
      Alert.alert('保存失败', error.message || '请重试');
    }
  };

  // 格式化时间
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const nutrition = calculateNutrition();

  // 渲染录音界面
  const renderRecordingInterface = () => (
    <View style={styles.recordingContainer}>
      <Text style={styles.recordingHint}>正在聆听...</Text>
      <Text style={styles.recordingSubHint}>描述你吃的食物，例如"一碗牛肉面"</Text>
      
      {/* 录音动画 */}
      <View style={styles.waveContainer}>
        {waveAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveBar,
              {
                transform: [{ scaleY: anim }],
                opacity: 0.6 + index * 0.2,
              },
            ]}
          />
        ))}
      </View>

      {/* 录音时长 */}
      <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
      <Text style={styles.durationHint}>最长可录制60秒</Text>

      {/* 停止按钮 */}
      <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
        <Ionicons name="stop" size={32} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.stopHint}>点击结束录音</Text>
    </View>
  );

  // 渲染处理中界面
  const renderProcessingInterface = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.processingText}>正在识别语音...</Text>
      <Text style={styles.processingSubText}>AI正在分析您描述的食物</Text>
    </View>
  );

  // 渲染结果界面
  const renderResultInterface = () => (
    <ScrollView style={styles.resultScrollView} showsVerticalScrollIndicator={false}>
      {/* 识别文本 */}
      <View style={styles.transcribedCard}>
        <Text style={styles.transcribedLabel}>识别内容</Text>
        <Text style={styles.transcribedText}>"{transcribedText}"</Text>
      </View>

      {analysisResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{analysisResult.foodName}</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                置信度 {Math.round((analysisResult.confidence || 0.8) * 100)}%
              </Text>
            </View>
          </View>

          {/* 份量调整 */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>份量调整</Text>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <Text style={styles.quantityUnit}>g</Text>
            </View>
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderBtn}
                onPress={() => setQuantity(Math.max(10, quantity - 10))}
              >
                <Ionicons name="remove" size={20} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${Math.min((quantity / 500) * 100, 100)}%` },
                  ]}
                />
              </View>
              <TouchableOpacity
                style={styles.sliderBtn}
                onPress={() => setQuantity(Math.min(1000, quantity + 10))}
              >
                <Ionicons name="add" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {/* 快捷份量 */}
            <View style={styles.quickQuantities}>
              {[50, 100, 150, 200, 250].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.quickBtn, quantity === q && styles.quickBtnActive]}
                  onPress={() => setQuantity(q)}
                >
                  <Text
                    style={[
                      styles.quickBtnText,
                      quantity === q && styles.quickBtnTextActive,
                    ]}
                  >
                    {q}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 营养成分 */}
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionLabel}>营养成分（每 {quantity}g）</Text>
            <View style={styles.nutritionGrid}>
              <View style={[styles.nutritionItem, styles.calorieItem]}>
                <Text style={styles.nutritionValue}>{nutrition?.calories || 0}</Text>
                <Text style={styles.nutritionLabel}>千卡</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition?.protein || 0}g</Text>
                <Text style={styles.nutritionLabel}>蛋白质</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition?.carbs || 0}g</Text>
                <Text style={styles.nutritionLabel}>碳水</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{nutrition?.fat || 0}g</Text>
                <Text style={styles.nutritionLabel}>脂肪</Text>
              </View>
            </View>
            <View style={styles.nutritionSubGrid}>
              <View style={styles.nutritionSubItem}>
                <Text style={styles.nutritionSubValue}>{nutrition?.fiber || 0}g</Text>
                <Text style={styles.nutritionSubLabel}>膳食纤维</Text>
              </View>
              <View style={styles.nutritionSubItem}>
                <Text style={styles.nutritionSubValue}>{nutrition?.sodium || 0}mg</Text>
                <Text style={styles.nutritionSubLabel}>钠</Text>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retakeBtn} onPress={retakeRecording}>
              <Text style={styles.retakeBtnText}>重新录制</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveRecord}>
              <Text style={styles.saveBtnText}>保存记录</Text>
            </TouchableOpacity>
          </View>

          {/* 提示 */}
          <Text style={styles.aiTip}>
            💡 AI 分析结果仅供参考，实际营养成分可能因食材和烹饪方式而异
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // 渲染错误界面
  const renderErrorInterface = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={Colors.warning} />
      <Text style={styles.errorTitle}>识别失败</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retakeRecording}>
        <Text style={styles.retryButtonText}>重新尝试</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染初始界面
  const renderIdleInterface = () => (
    <View style={styles.centerContainer}>
      <View style={styles.voiceIconContainer}>
        <Ionicons name="mic" size={64} color={Colors.primary} />
      </View>
      <Text style={styles.idleTitle}>语音速记</Text>
      <Text style={styles.idleHint}>按住下方按钮，描述你吃的食物{'\n'}AI 将自动识别并分析营养成分</Text>
      
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleTitle}>示例：</Text>
        <Text style={styles.exampleText}>• "一碗牛肉面加一个煎蛋"</Text>
        <Text style={styles.exampleText}>• "150克米饭配宫保鸡丁"</Text>
        <Text style={styles.exampleText}>• "一个苹果和一杯酸奶"</Text>
      </View>

      {/* 录音按钮 */}
      <TouchableOpacity 
        style={styles.recordButton}
        onPress={startRecording}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.recordButtonInner, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="mic" size={40} color="white" />
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.recordHint}>点击开始录音</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>语音速记</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 主要内容 */}
      <View style={styles.content}>
        {recordingStatus === 'idle' && renderIdleInterface()}
        {recordingStatus === 'recording' && renderRecordingInterface()}
        {recordingStatus === 'processing' && renderProcessingInterface()}
        {recordingStatus === 'success' && renderResultInterface()}
        {recordingStatus === 'error' && renderErrorInterface()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  // 初始状态样式
  voiceIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  idleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  idleHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  exampleContainer: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 32,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordHint: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // 录音中样式
  recordingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  recordingHint: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  recordingSubHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 48,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    gap: 12,
    marginBottom: 48,
  },
  waveBar: {
    width: 12,
    height: 60,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  durationHint: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 48,
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stopHint: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // 处理中样式
  processingText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  processingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // 结果样式
  resultScrollView: {
    flex: 1,
    padding: 16,
  },
  transcribedCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  transcribedLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  transcribedText: {
    fontSize: 16,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  quantitySection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  quantityUnit: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  quickQuantities: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cream,
  },
  quickBtnActive: {
    backgroundColor: Colors.primary,
  },
  quickBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickBtnTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  nutritionSection: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  calorieItem: {
    backgroundColor: Colors.primaryLight,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  nutritionSubGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  nutritionSubItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  nutritionSubValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  nutritionSubLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  retakeBtnText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.warning,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiTip: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // 错误样式
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  errorMessage: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

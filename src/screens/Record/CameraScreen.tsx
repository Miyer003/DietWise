import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Colors from '../../constants/Colors';
import { AIService, DietService } from '../../services/api';
import { NutritionAnalysisResult, MealType } from '../../types';

const { width, height } = Dimensions.get('window');

interface CameraScreenProps {
  navigation: any;
  route: {
    params?: {
      mealType?: MealType;
    };
  };
}

export default function CameraScreen({ navigation, route }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NutritionAnalysisResult | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const mealType = route.params?.mealType || 'snack';

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // 拍照
  const takePicture = async () => {
    if (!cameraRef.current) {
      console.log('相机引用为空');
      return;
    }

    try {
      console.log('正在拍照...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      console.log('拍照成功:', photo?.uri?.substring(0, 50) + '...');
      if (photo) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败，请重试');
    }
  };

  // 从相册选择
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  // 将图片转为 base64（支持 Web 和移动端）
  const imageToBase64 = async (uri: string): Promise<string> => {
    try {
      // Web 端处理
      if (uri.startsWith('data:')) {
        // 已经是 base64 data URL
        return uri.split(',')[1];
      }
      
      if (uri.startsWith('http') || uri.startsWith('blob:')) {
        // 网络图片或 blob URL，使用 fetch
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      // 移动端本地文件，使用 expo-file-system
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('图片转 base64 失败:', error);
      throw new Error('图片处理失败: ' + (error as Error).message);
    }
  };

  // 分析图片（使用 base64，不经过 MinIO）
  const analyzeImage = async () => {
    // 强制弹出 alert 确认按钮被点击（Web 调试用）
    if (typeof window !== 'undefined') {
      console.log('=== analyzeImage 按钮被点击 ===');
    }
    
    if (!capturedImage) {
      Alert.alert('错误', '请先拍照');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('=== BASE64 VERSION v3 ===');  // 版本标记
      console.log('开始分析图片:', capturedImage);
      console.log('图片 URI 类型:', capturedImage.substring(0, 30) + '...');
      
      // 1. 将图片转为 base64
      const base64Image = await imageToBase64(capturedImage);
      console.log('Base64 转换成功，长度:', base64Image.length);

      // 2. 调用 AI 分析（直接传 base64）
      const analyzeRes = await AIService.analyzeNutrition({
        type: 'image',
        imageBase64: base64Image,
      });
      
      console.log('AI 分析结果:', analyzeRes);

      if (analyzeRes.code === 0 && analyzeRes.data) {
        setAnalysisResult(analyzeRes.data);
      } else {
        throw new Error(analyzeRes.message || '分析失败');
      }
    } catch (error: any) {
      console.error('分析失败:', error);
      Alert.alert('分析失败', error.message || '请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 保存记录
  const saveRecord = async (result: NutritionAnalysisResult) => {
    console.log('=== saveRecord 被调用 ===', result);
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('准备保存记录:', { today, mealType, result });
      
      const requestData = {
        recordDate: today,
        mealType: mealType,
        inputMethod: 'photo',
        items: [
          {
            foodName: result.foodName,
            quantityG: result.quantityG,
            calories: result.calories,
            proteinG: result.proteinG,
            carbsG: result.carbsG,
            fatG: result.fatG,
            fiberG: result.fiberG || 0,
            sodiumMg: result.sodiumMg || 0,
            aiConfidence: result.confidence,
          },
        ],
      };
      console.log('请求数据:', JSON.stringify(requestData, null, 2));
      
      const recordRes = await DietService.createRecord(requestData);
      console.log('保存响应:', recordRes);

      if (recordRes.code === 0) {
        console.log('保存成功!');
        
        // Web 端使用 window.confirm
        if (typeof window !== 'undefined' && window.confirm) {
          const goHome = window.confirm('记录已保存!\n\n点击"确定"返回首页，点击"取消"继续记录');
          if (goHome) {
            navigation.navigate('Main');
          } else {
            setCapturedImage(null);
            setAnalysisResult(null);
          }
        } else {
          // 移动端使用 Alert
          Alert.alert('成功', '记录已保存', [
            {
              text: '继续记录',
              onPress: () => {
                setCapturedImage(null);
                setAnalysisResult(null);
              },
            },
            {
              text: '返回首页',
              onPress: () => navigation.navigate('Main'),
              style: 'cancel',
            },
          ]);
        }
      } else {
        throw new Error(recordRes.message || '保存失败');
      }
    } catch (error: any) {
      Alert.alert('保存失败', error.message || '请重试');
    }
  };

  // 重新拍摄
  const retake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>需要相机权限</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>授权访问</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 显示分析结果
  if (analysisResult) {
    console.log('显示分析结果页面:', analysisResult);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>识别结果 - {analysisResult.foodName}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.resultContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.resultImage} />
          )}

          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.foodName}>{analysisResult.foodName}</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  置信度 {Math.round(analysisResult.confidence * 100)}%
                </Text>
              </View>
            </View>

            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{analysisResult.calories}</Text>
                <Text style={styles.nutritionLabel}>千卡</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{analysisResult.proteinG}g</Text>
                <Text style={styles.nutritionLabel}>蛋白质</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{analysisResult.carbsG}g</Text>
                <Text style={styles.nutritionLabel}>碳水</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{analysisResult.fatG}g</Text>
                <Text style={styles.nutritionLabel}>脂肪</Text>
              </View>
            </View>

            <Text style={styles.portionText}>份量: {analysisResult.quantityG}g</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retakeBtn} onPress={retake}>
              <Text style={styles.retakeBtnText}>重新拍摄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                console.log('保存记录按钮被点击', analysisResult);
                saveRecord(analysisResult);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>保存记录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {capturedImage ? (
        // 预览模式
        <>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={retake}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>照片预览</Text>
            <View style={{ width: 28 }} />
          </View>

          <Image source={{ uri: capturedImage }} style={styles.previewImage} />

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeBtn} onPress={retake}>
              <Text style={styles.retakeBtnText}>重拍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.analyzeBtn, isAnalyzing && styles.analyzeBtnDisabled]}
              onPress={() => {
                console.log('AI识别按钮被点击');
                analyzeImage();
              }}
              disabled={isAnalyzing}
              activeOpacity={0.7}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.analyzeBtnContent}>
                  <Ionicons name="scan" size={20} color="white" />
                  <Text style={styles.analyzeBtnText}>AI识别</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // 拍摄模式
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <View style={styles.mealTypeBadge}>
                <Text style={styles.mealTypeText}>
                  {mealType === 'breakfast' && '早餐'}
                  {mealType === 'lunch' && '午餐'}
                  {mealType === 'dinner' && '晚餐'}
                  {mealType === 'snack' && '加餐'}
                </Text>
              </View>
              <View style={{ width: 28 }} />
            </View>

            {/* 对焦框 */}
            <View style={styles.focusFrame}>
              <View style={styles.focusCorner} />
              <View style={[styles.focusCorner, styles.focusCornerTopRight]} />
              <View style={[styles.focusCorner, styles.focusCornerBottomLeft]} />
              <View style={[styles.focusCorner, styles.focusCornerBottomRight]} />
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
                <Ionicons name="images" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>

              <View style={{ width: 48 }} />
            </View>
          </CameraView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  mealTypeBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mealTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  focusFrame: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.15,
    right: width * 0.15,
    height: width * 0.7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  focusCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: Colors.primary,
  },
  focusCornerTopRight: {
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  focusCornerBottomLeft: {
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  focusCornerBottomRight: {
    right: 0,
    bottom: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  galleryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'black',
  },
  retakeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  retakeBtnText: {
    fontSize: 16,
    color: Colors.text,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    cursor: 'pointer',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      },
    }),
  },
  analyzeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzeBtnDisabled: {
    opacity: 0.7,
  },
  analyzeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  foodName: {
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
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  portionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    ...Platform.select({
      web: {
        display: 'flex',
      },
    }),
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
      },
    }),
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

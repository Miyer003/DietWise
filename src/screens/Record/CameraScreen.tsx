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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (photo) {
        setCapturedImage(photo.uri);
      }
    } catch (error) {
      Alert.alert('错误', '拍照失败，请重试');
    }
  };

  // 从相册选择
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  // 分析图片
  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);
    try {
      // 1. 获取上传URL
      const filename = capturedImage.split('/').pop() || 'image.jpg';
      const uploadRes = await DietService.getUploadUrl(filename);

      if (uploadRes.code !== 0 || !uploadRes.data) {
        throw new Error('获取上传链接失败');
      }

      const { uploadUrl, objectName } = uploadRes.data;

      // 2. 上传图片到 MinIO
      const imageResponse = await fetch(capturedImage);
      const blob = await imageResponse.blob();

      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      // 3. 调用 AI 分析
      const imageUrl = uploadUrl.split('?')[0]; // 去掉预签名参数
      const analyzeRes = await AIService.analyzeNutrition({
        type: 'image',
        image_url: imageUrl,
      });

      if (analyzeRes.code === 0 && analyzeRes.data) {
        setAnalysisResult(analyzeRes.data);
      } else {
        throw new Error(analyzeRes.message || '分析失败');
      }
    } catch (error: any) {
      Alert.alert('分析失败', error.message || '请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 保存记录
  const saveRecord = async (result: NutritionAnalysisResult) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const recordRes = await DietService.createRecord({
        record_date: today,
        meal_type: mealType,
        input_method: 'photo',
        items: [
          {
            food_name: result.food_name,
            quantity_g: result.quantity_g,
            calories: result.calories,
            protein_g: result.protein_g,
            carbs_g: result.carbs_g,
            fat_g: result.fat_g,
            fiber_g: result.fiber_g || 0,
            sodium_mg: result.sodium_mg || 0,
            ai_confidence: result.confidence,
          },
        ],
      });

      if (recordRes.code === 0) {
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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>识别结果</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.resultContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.resultImage} />
          )}

          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.foodName}>{analysisResult.food_name}</Text>
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
                <Text style={styles.nutritionValue}>{analysisResult.protein_g}g</Text>
                <Text style={styles.nutritionLabel}>蛋白质</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{analysisResult.carbs_g}g</Text>
                <Text style={styles.nutritionLabel}>碳水</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{analysisResult.fat_g}g</Text>
                <Text style={styles.nutritionLabel}>脂肪</Text>
              </View>
            </View>

            <Text style={styles.portionText}>份量: {analysisResult.quantity_g}g</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retakeBtn} onPress={retake}>
              <Text style={styles.retakeBtnText}>重新拍摄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => saveRecord(analysisResult)}
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
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="scan" size={20} color="white" />
                  <Text style={styles.analyzeBtnText}>AI识别</Text>
                </>
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
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
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
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

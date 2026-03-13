import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { AIService, DietService } from '../../services/api';
import { NutritionAnalysisResult, MealType } from '../../types';

interface FoodAIInputScreenProps {
  navigation: any;
  route: {
    params: {
      mealType: MealType;
    };
  };
}

export default function FoodAIInputScreen({ navigation, route }: FoodAIInputScreenProps) {
  const { mealType } = route.params;
  const [foodName, setFoodName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<NutritionAnalysisResult | null>(null);
  const [quantity, setQuantity] = useState(100);

  // AI 分析食物
  const analyzeFood = async () => {
    if (!foodName.trim()) {
      Alert.alert('提示', '请输入食物名称');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await AIService.analyzeNutrition({
        type: 'text',
        description: foodName.trim(),
      });

      if (response.code === 0 && response.data) {
        setAnalysisResult(response.data);
        setQuantity(response.data.quantityG || 100);
      } else {
        Alert.alert('分析失败', response.message || '请稍后重试');
      }
    } catch (error: any) {
      console.error('AI 分析失败:', error);
      Alert.alert('分析失败', error.message || '网络错误，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 计算实际营养值（根据用户调整的份量）
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
        inputMethod: 'manual',
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
            onPress: () => {
              setFoodName('');
              setAnalysisResult(null);
              setQuantity(100);
            },
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

  const nutrition = calculateNutrition();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI 智能分析</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 输入区域 */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>描述你吃的食物</Text>
            <Text style={styles.inputHint}>例如：一碗牛肉面、一个汉堡、150克米饭配炒青菜</Text>
            <TextInput
              style={styles.textInput}
              placeholder="请输入食物名称或描述..."
              value={foodName}
              onChangeText={setFoodName}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.analyzeBtn, isAnalyzing && styles.analyzeBtnDisabled]}
              onPress={analyzeFood}
              disabled={isAnalyzing || !foodName.trim()}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" style={styles.btnIcon} />
                  <Text style={styles.analyzeBtnText}>AI 分析营养成分</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 分析结果 */}
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

              {/* 保存按钮 */}
              <TouchableOpacity style={styles.saveBtn} onPress={saveRecord}>
                <Text style={styles.saveBtnText}>保存记录</Text>
              </TouchableOpacity>

              {/* 提示 */}
              <Text style={styles.aiTip}>
                💡 AI 分析结果仅供参考，实际营养成分可能因食材和烹饪方式而异
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inputCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  analyzeBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 4,
  },
  analyzeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
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
  saveBtn: {
    backgroundColor: Colors.warning,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
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
});

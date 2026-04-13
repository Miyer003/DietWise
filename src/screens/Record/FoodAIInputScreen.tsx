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
import ScreenHeader from '../../components/ScreenHeader';
import { Theme } from '../../constants/Theme';
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
        <ScreenHeader title="AI 智能分析" />

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
                    <Ionicons name="remove" size={20} color={Theme.colors.text} />
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
                    <Ionicons name="add" size={20} color={Theme.colors.text} />
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
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  inputCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.page,
    marginBottom: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
  },
  inputLabel: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  inputHint: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.lg,
  },
  textInput: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Theme.spacing.lg,
  },
  analyzeBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.content,
    borderRadius: Theme.radius.md,
    gap: Theme.spacing.sm,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: Theme.spacing.xs,
  },
  analyzeBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
  },
  resultCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.page,
    marginHorizontal: Theme.spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.page,
  },
  resultTitle: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  confidenceText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  quantitySection: {
    marginBottom: 24,
    paddingBottom: Theme.spacing.page,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: Theme.spacing.lg,
  },
  quantityValue: {
    fontSize: 48,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
  },
  quantityUnit: {
    fontSize: Theme.typography.sizes.h1,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.colors.border,
    borderRadius: 3,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 3,
  },
  quickQuantities: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Theme.spacing.compact,
  },
  quickBtn: {
    paddingHorizontal: Theme.spacing.content,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.cream,
  },
  quickBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  quickBtnText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  quickBtnTextActive: {
    color: 'white',
    fontWeight: Theme.typography.weights.medium,
  },
  nutritionSection: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
    marginBottom: Theme.spacing.md,
  },
  nutritionItem: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  calorieItem: {
    backgroundColor: Theme.colors.primaryLight,
  },
  nutritionValue: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  nutritionLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  nutritionSubGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  nutritionSubItem: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  nutritionSubValue: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  nutritionSubLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Theme.colors.warning,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  saveBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
  },
  aiTip: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

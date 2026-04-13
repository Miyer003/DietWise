import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { Theme } from '../../constants/Theme';
import { AIService, MealPlanService } from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { MealPlan } from '../../types';

interface AIGeneratePlanPreviewScreenProps {
  navigation: any;
  route: {
    params: {
      requestParams: {
        calorieTarget: number;
        mealCount: number;
        healthGoal: string;
        flavorPrefs: string[];
        restrictions: string[];
        customRequest: string;
        cookingDifficulty: string;
        heightCm?: number;
        weightKg?: number;
      };
    };
  };
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MEAL_TYPE_NAMES: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export default function AIGeneratePlanPreviewScreen({ navigation, route }: AIGeneratePlanPreviewScreenProps) {
  const { requestParams } = route.params;
  const { refreshUser } = useAuth();
  
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<number[]>([1]); // 默认展开第一天

  // 生成食谱
  useEffect(() => {
    generatePlan();
  }, []);

  const generatePlan = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // 构建请求参数，过滤掉 undefined 值
      const apiParams: any = {
        calorieTarget: requestParams.calorieTarget,
        mealCount: requestParams.mealCount,
        healthGoal: requestParams.healthGoal,
        flavorPrefs: requestParams.flavorPrefs,
      };
      
      // 只在有值时才传递身高体重
      if (requestParams.heightCm != null && !isNaN(requestParams.heightCm)) {
        apiParams.heightCm = requestParams.heightCm;
      }
      if (requestParams.weightKg != null && !isNaN(requestParams.weightKg)) {
        apiParams.weightKg = requestParams.weightKg;
      }
      if (requestParams.customRequest) {
        apiParams.customRequest = requestParams.customRequest;
      }
      if (requestParams.restrictions?.length) {
        apiParams.restrictions = requestParams.restrictions;
      }
      if (requestParams.cookingDifficulty) {
        apiParams.cookingDifficulty = requestParams.cookingDifficulty;
      }
      
      const response = await AIService.generateMealPlan(apiParams);

      if (response.code === 0 && response.data) {
        setGeneratedPlan(response.data);
      } else {
        setError(response.message || '生成失败，请重试');
      }
    } catch (err: any) {
      console.error('生成食谱失败:', err);
      // 处理超时错误
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('请求超时，AI生成食谱需要较长时间，请重试或检查网络');
      } else if (err.code === 'ERR_NETWORK') {
        setError('网络连接失败，请检查网络后重试');
      } else {
        setError(err.message || '网络错误，请稍后重试');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 应用食谱
  const applyPlan = async () => {
    if (!generatedPlan) return;

    setIsSaving(true);
    try {
      // 刷新用户数据
      await refreshUser();
      Alert.alert('成功', 'AI 食谱已应用！', [
        {
          text: '查看详情',
          onPress: () => {
            navigation.navigate('MealPlanDetail', { planId: generatedPlan.id });
          },
        },
        {
          text: '返回',
          onPress: () => navigation.navigate('MealPlan'),
          style: 'cancel',
        },
      ]);
    } catch (err: any) {
      Alert.alert('保存失败', err.message || '请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 重新生成
  const regenerate = () => {
    Alert.alert('重新生成', '确定要重新生成食谱吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', onPress: generatePlan },
    ]);
  };

  // 修改需求
  const editRequest = () => {
    navigation.goBack();
  };

  // 展开/收起某天
  const toggleDay = (dayOfWeek: number) => {
    if (expandedDays.includes(dayOfWeek)) {
      setExpandedDays(expandedDays.filter(d => d !== dayOfWeek));
    } else {
      setExpandedDays([...expandedDays, dayOfWeek]);
    }
  };

  // 计算一周总营养
  const calculateWeeklyTotal = () => {
    if (!generatedPlan?.days) return null;
    
    // 按天分组计算
    const dayMap = new Map<number, { calories: number; protein: number; carbs: number; fat: number }>();
    
    generatedPlan.days.forEach(day => {
      const dayNum = day.dayOfWeek;
      if (!dayMap.has(dayNum)) {
        dayMap.set(dayNum, { calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
      const dayStats = dayMap.get(dayNum)!;
      
      // 处理嵌套 meals 结构
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach(meal => {
          dayStats.calories += meal.totalCalories || 0;
          meal.dishes?.forEach((dish: any) => {
            dayStats.protein += parseFloat(dish.protein_g || dish.proteinG) || 0;
            dayStats.carbs += parseFloat(dish.carbs_g || dish.carbsG) || 0;
            dayStats.fat += parseFloat(dish.fat_g || dish.fatG) || 0;
          });
        });
      } 
      // 兼容扁平结构
      else if (day.mealType) {
        dayStats.calories += parseFloat(day.totalCalories as any) || 0;
        day.dishes?.forEach((dish: any) => {
          dayStats.protein += parseFloat(dish.protein_g || dish.proteinG) || 0;
          dayStats.carbs += parseFloat(dish.carbs_g || dish.carbsG) || 0;
          dayStats.fat += parseFloat(dish.fat_g || dish.fatG) || 0;
        });
      }
    });

    // 计算平均值
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    dayMap.forEach(stats => {
      totalCalories += stats.calories;
      totalProtein += stats.protein;
      totalCarbs += stats.carbs;
      totalFat += stats.fat;
    });

    const dayCount = dayMap.size || 7;
    
    return {
      avgCalories: Math.round(totalCalories / dayCount),
      avgProtein: Math.round(totalProtein / dayCount),
      avgCarbs: Math.round(totalCarbs / dayCount),
      avgFat: Math.round(totalFat / dayCount),
    };
  };

  // 获取某天的数据（处理后端的嵌套 meals 结构）
  const getDayData = (dayOfWeek: number): any[] => {
    if (!generatedPlan?.days) return [];
    
    const day = generatedPlan.days.find(d => d.dayOfWeek === dayOfWeek);
    if (!day) return [];
    
    // 如果是嵌套结构（有 meals 数组）
    if (day.meals && Array.isArray(day.meals)) {
      return day.meals;
    }
    
    // 如果是扁平结构（兼容旧数据）
    if (day.mealType) {
      return [{
        mealType: day.mealType,
        dishes: day.dishes || [],
        totalCalories: day.totalCalories || 0,
        notes: day.notes,
      }];
    }
    
    return [];
  };

  // 计算某天总热量
  const getDayTotalCalories = (dayOfWeek: number) => {
    const meals = getDayData(dayOfWeek);
    return meals.reduce((sum, meal) => {
      const calories = meal.totalCalories || 0;
      return sum + calories;
    }, 0);
  };

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={40} color={Theme.colors.primary} />
            <View style={styles.aiThinking}>
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            </View>
          </View>
          <Text style={styles.loadingTitle}>AI 正在为你定制食谱</Text>
          <Text style={styles.loadingDesc}>
            正在根据你的{requestParams.healthGoal}目标和口味偏好，生成专属一周食谱...
          </Text>
          <Text style={styles.loadingTimeHint}>
            大约需要 30-90 秒，请耐心等待
          </Text>
          <View style={styles.loadingParams}>
            <View style={styles.paramTag}>
              <Text style={styles.paramText}>{requestParams.calorieTarget} kcal/天</Text>
            </View>
            <View style={styles.paramTag}>
              <Text style={styles.paramText}>{requestParams.mealCount}餐/天</Text>
            </View>
            {requestParams.flavorPrefs.map(pref => (
              <View key={pref} style={styles.paramTag}>
                <Text style={styles.paramText}>{pref}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={Theme.colors.danger} style={styles.errorIcon} />
          <Text style={styles.errorTitle}>生成失败</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryBtn} onPress={generatePlan}>
              <Text style={styles.retryBtnText}>重试</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>修改需求</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const weeklyStats = calculateWeeklyTotal();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={isGenerating} onRefresh={generatePlan} />
        }
      >
        {/* 头部 */}
        <ScreenHeader
          title="AI 食谱预览"
          rightElement={
            <TouchableOpacity onPress={editRequest}>
              <Text style={styles.editBtn}>修改</Text>
            </TouchableOpacity>
          }
        />

        {/* 概览卡片 */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color={Theme.colors.primary} style={{ marginRight: Theme.spacing.xs }} />
              <Text style={styles.aiBadgeText}>AI 生成</Text>
            </View>
            <TouchableOpacity style={styles.regenerateBtn} onPress={regenerate}>
              <Ionicons name="refresh" size={16} color={Theme.colors.primary} />
              <Text style={styles.regenerateText}>重新生成</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{requestParams.calorieTarget}</Text>
              <Text style={styles.statLabel}>目标热量(kcal)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats?.avgCalories || 0}</Text>
              <Text style={styles.statLabel}>平均每日(kcal)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{requestParams.mealCount}</Text>
              <Text style={styles.statLabel}>每日餐数</Text>
            </View>
          </View>

          {weeklyStats && (weeklyStats.avgProtein > 0 || weeklyStats.avgCarbs > 0 || weeklyStats.avgFat > 0) && (
            <View style={styles.nutritionOverview}>
              <Text style={styles.nutritionOverviewTitle}>平均每日营养</Text>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionPill}>
                  <Text style={styles.nutritionPillValue}>{weeklyStats.avgProtein}g</Text>
                  <Text style={styles.nutritionPillLabel}>蛋白质</Text>
                </View>
                <View style={styles.nutritionPill}>
                  <Text style={styles.nutritionPillValue}>{weeklyStats.avgCarbs}g</Text>
                  <Text style={styles.nutritionPillLabel}>碳水</Text>
                </View>
                <View style={styles.nutritionPill}>
                  <Text style={styles.nutritionPillValue}>{weeklyStats.avgFat}g</Text>
                  <Text style={styles.nutritionPillLabel}>脂肪</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.preferencesRow}>
            <Text style={styles.preferencesLabel}>饮食目标：</Text>
            <View style={styles.preferencesTags}>
              <View style={styles.prefTag}>
                <Text style={styles.prefTagText}>{requestParams.healthGoal}</Text>
              </View>
              {requestParams.flavorPrefs.map(pref => (
                <View key={pref} style={styles.prefTag}>
                  <Text style={styles.prefTagText}>{pref}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 每日食谱 */}
        <View style={styles.daysSection}>
          <Text style={styles.sectionTitle}>一周食谱详情</Text>
          
          {WEEK_DAYS.map((dayName, index) => {
            const dayOfWeek = index + 1;
            const dayData = getDayData(dayOfWeek);
            const isExpanded = expandedDays.includes(dayOfWeek);
            const dayCalories = getDayTotalCalories(dayOfWeek);

            if (dayData.length === 0) return null;

            return (
              <View key={dayOfWeek} style={styles.dayCard}>
                <TouchableOpacity 
                  style={styles.dayHeader}
                  onPress={() => toggleDay(dayOfWeek)}
                >
                  <View style={styles.dayTitleSection}>
                    <Text style={styles.dayName}>{dayName}</Text>
                    <Text style={styles.dayCalories}>{dayCalories} kcal</Text>
                  </View>
                  <View style={styles.dayHeaderRight}>
                    <Text style={styles.dayMealCount}>{dayData.length}餐</Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={Theme.colors.textMuted} 
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.dayContent}>
                    {dayData.map((meal, mealIndex) => (
                      <View key={mealIndex} style={styles.mealSection}>
                        <View style={styles.mealHeader}>
                          <Text style={styles.mealType}>{MEAL_TYPE_NAMES[meal.mealType] || meal.mealType}</Text>
                          <Text style={styles.mealCalories}>{meal.totalCalories || 0} kcal</Text>
                        </View>
                        
                        <View style={styles.dishesList}>
                          {meal.dishes?.map((dish, dishIndex) => {
                            // 兼容后端返回的下划线命名和驼峰命名
                            const quantity = dish.quantityG || dish.quantity_g || 0;
                            const protein = dish.proteinG || dish.protein_g || 0;
                            const carbs = dish.carbsG || dish.carbs_g || 0;
                            const fat = dish.fatG || dish.fat_g || 0;
                            const cookingTip = dish.cookingTip || dish.cooking_tip;
                            
                            return (
                              <View key={dishIndex} style={styles.dishItem}>
                                <View style={styles.dishMainRow}>
                                  <View style={styles.dishInfo}>
                                    <Text style={styles.dishName}>{dish.name}</Text>
                                    <View style={styles.dishMeta}>
                                      <Text style={styles.dishQuantity}>{quantity}g</Text>
                                      {(protein > 0 || carbs > 0 || fat > 0) && (
                                        <>
                                          <Text style={styles.dishDot}>·</Text>
                                          <Text style={styles.dishNutrition}>
                                            蛋{protein}g·碳{carbs}g·脂{fat}g
                                          </Text>
                                        </>
                                      )}
                                    </View>
                                  </View>
                                  <Text style={styles.dishCals}>{dish.calories} kcal</Text>
                                </View>
                                {cookingTip && (
                                  <Text style={styles.cookingTip}>{cookingTip}</Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                    
                    {dayData[0]?.notes && (
                      <View style={styles.dayNotes}>
                        <Text style={styles.dayNotesText}>{dayData[0].notes}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 底部操作 */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.adjustBtn} onPress={editRequest}>
            <Ionicons name="create-outline" size={18} color={Theme.colors.text} />
            <Text style={styles.adjustBtnText}>调整需求</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.applyBtn, isSaving && styles.applyBtnDisabled]}
            onPress={applyPlan}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.applyBtnText}>应用此食谱</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  aiIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  aiIcon: {
    fontSize: 64,
  },
  aiThinking: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'white',
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingTitle: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  loadingDesc: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  loadingTimeHint: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingParams: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
  },
  paramTag: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.lg,
  },
  paramText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Theme.spacing.lg,
  },
  errorTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  errorText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  retryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.xs,
  },
  retryBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
  },
  backBtn: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.card,
    paddingHorizontal: 24,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.xs,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  backBtnText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  editBtn: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  overviewCard: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.card,
    margin: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.page,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.page,
  },
  aiBadge: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.xs,
  },
  aiBadgeText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.semibold,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  regenerateText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  nutritionOverview: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  nutritionOverviewTitle: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  nutritionPill: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.xs,
    padding: Theme.spacing.compact,
    alignItems: 'center',
  },
  nutritionPillValue: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  nutritionPillLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  preferencesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: Theme.spacing.lg,
  },
  preferencesLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginRight: Theme.spacing.sm,
  },
  preferencesTags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
  },
  prefTag: {
    backgroundColor: Theme.colors.cream,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: 6,
  },
  prefTagText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  daysSection: {
    paddingHorizontal: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  dayCard: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.card,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.compact,
    overflow: 'hidden',
    marginHorizontal: Theme.spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
  },
  dayTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  dayName: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  dayCalories: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  dayMealCount: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
  },
  dayContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
  },
  mealSection: {
    marginBottom: Theme.spacing.lg,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  mealType: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  mealCalories: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.warning,
    fontWeight: Theme.typography.weights.medium,
  },
  dishesList: {
    gap: Theme.spacing.sm,
  },
  dishItem: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.xs,
    padding: Theme.spacing.md,
  },
  dishMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
    flexWrap: 'wrap',
  },
  dishQuantity: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  dishDot: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  dishNutrition: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  dishCals: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.warning,
    fontWeight: Theme.typography.weights.semibold,
  },
  cookingTip: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: Theme.spacing.xs,
  },
  dayNotes: {
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.radius.xs,
    padding: Theme.spacing.compact,
    marginTop: Theme.spacing.sm,
  },
  dayNotesText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    padding: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
  },
  adjustBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.card,
    paddingVertical: Theme.spacing.content,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: Theme.spacing.xs,
  },
  adjustBtnText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.content,
    borderRadius: Theme.radius.md,
    gap: Theme.spacing.xs,
    ...Theme.shadows.cardPressed,
  },
  applyBtnDisabled: {
    opacity: 0.7,
  },
  applyBtnText: {
    fontSize: Theme.typography.sizes.body,
    color: 'white',
    fontWeight: Theme.typography.weights.bold,
  },
});

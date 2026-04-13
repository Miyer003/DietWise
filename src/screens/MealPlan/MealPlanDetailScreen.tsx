import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { Theme } from '../../constants/Theme';
import { MealPlan } from '../../types';
import { MealPlanService } from '../../services/api';

interface MealPlanDetailScreenProps {
  navigation: any;
  route: {
    params: {
      planId?: string;
      mealPlan?: MealPlan;
    };
  };
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function MealPlanDetailScreen({ navigation, route }: MealPlanDetailScreenProps) {
  const { planId, mealPlan: initialMealPlan } = route.params || {};
  
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(initialMealPlan || null);
  const [isLoading, setIsLoading] = useState(!initialMealPlan && !!planId);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<number[]>([1]); // 默认展开第一天

  useEffect(() => {
    if (!initialMealPlan && planId) {
      loadPlanDetail();
    }
  }, [planId, initialMealPlan]);

  const loadPlanDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await MealPlanService.getPlanById(planId!);
      if (res.code === 0 && res.data) {
        setMealPlan(res.data);
      } else {
        setError('获取食谱详情失败');
      }
    } catch (err) {
      console.error('获取食谱详情失败:', err);
      setError('获取食谱详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getDayData = (dayOfWeek: number): any[] => {
    if (!mealPlan?.days) return [];
    
    const day = mealPlan.days.find(d => d.dayOfWeek === dayOfWeek);
    if (!day) return [];
    
    if (day.meals && Array.isArray(day.meals)) {
      return day.meals;
    }
    
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

  const toggleDay = (dayOfWeek: number) => {
    if (expandedDays.includes(dayOfWeek)) {
      setExpandedDays(expandedDays.filter(d => d !== dayOfWeek));
    } else {
      setExpandedDays([...expandedDays, dayOfWeek]);
    }
  };

  const handleActivatePlan = async () => {
    if (!mealPlan?.id) return;
    
    try {
      const res = await MealPlanService.activatePlan(mealPlan.id);
      if (res.code === 0) {
        Alert.alert('成功', '食谱已激活，将用于您的每日饮食推荐');
        setMealPlan({ ...mealPlan, status: 'active' });
      } else {
        throw new Error(res.message || '激活失败');
      }
    } catch (err: any) {
      console.error('激活食谱失败:', err);
      Alert.alert('激活失败', err.message || '请稍后重试');
    }
  };

  const getMealTypeName = (type: string) => {
    const names: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return names[type] || type;
  };

  const getMealIcon = (type: string): React.ComponentProps<typeof Ionicons>['name'] => {
    const icons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
      breakfast: 'sunny-outline',
      lunch: 'sunny',
      dinner: 'moon-outline',
      snack: 'cafe-outline',
    };
    return icons[type] || 'restaurant-outline';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !mealPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || '食谱不存在'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadPlanDetail}>
            <Text style={styles.retryBtnText}>重试</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="食谱详情" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 计划概览 */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={[styles.planTypeBadge, 
              mealPlan.planType === 'ai' ? styles.aiBadge : styles.customBadge
            ]}>
              <Text style={[
                styles.planTypeText,
                mealPlan.planType === 'ai' ? styles.aiBadgeText : styles.customBadgeText
              ]}>
                {mealPlan.planType === 'ai' ? 'AI生成' : '自定义'}
              </Text>
            </View>
            <Text style={styles.planStatus}>
              {mealPlan.status === 'active' ? '进行中' : '已归档'}
            </Text>
          </View>

          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mealPlan.calorieTarget}</Text>
              <Text style={styles.statLabel}>目标热量(kcal)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mealPlan.mealCount}</Text>
              <Text style={styles.statLabel}>每日餐数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mealPlan.healthGoal}</Text>
              <Text style={styles.statLabel}>饮食目标</Text>
            </View>
          </View>

          {mealPlan.flavorPrefs && mealPlan.flavorPrefs.length > 0 && (
            <View style={styles.flavorContainer}>
              {mealPlan.flavorPrefs.map((pref, index) => (
                <View key={index} style={styles.flavorTag}>
                  <Text style={styles.flavorText}>{pref}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 每日食谱 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>一周食谱详情</Text>
          
          {WEEK_DAYS.map((dayName, index) => {
            const dayOfWeek = index + 1;
            const dayMeals = getDayData(dayOfWeek);
            if (dayMeals.length === 0) return null;

            const dayTotalCalories = dayMeals.reduce((sum, meal) => {
              const calories = parseFloat(meal.totalCalories) || 0;
              return sum + calories;
            }, 0);

            const isExpanded = expandedDays.includes(dayOfWeek);

            return (
              <View key={index} style={styles.dayCard}>
                {/* 日期头部 - 可点击展开/收起 */}
                <TouchableOpacity 
                  style={styles.dayHeader}
                  onPress={() => toggleDay(dayOfWeek)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayHeaderLeft}>
                    <Text style={styles.dayName}>{dayName}</Text>
                    <View style={styles.dayCalorieBadge}>
                      <Text style={styles.dayCalorieText}>{Math.round(dayTotalCalories)} kcal</Text>
                    </View>
                  </View>
                  <View style={styles.dayHeaderRight}>
                    <Text style={styles.dayMealCount}>{dayMeals.length}餐</Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={Theme.colors.textMuted} 
                    />
                  </View>
                </TouchableOpacity>

                {/* 展开的餐食详情 */}
                {isExpanded && (
                  <View style={styles.dayContent}>
                    {dayMeals.map((meal, mealIndex) => (
                      <View key={mealIndex} style={styles.mealSection}>
                        {/* 餐次标题 */}
                        <View style={styles.mealHeader}>
                          <View style={styles.mealTitleRow}>
                            <Ionicons name={getMealIcon(meal.mealType)} size={16} color={Theme.colors.textSecondary} />
                            <Text style={styles.mealType}>{getMealTypeName(meal.mealType || 'breakfast')}</Text>
                          </View>
                          <View style={styles.mealCalorieBadge}>
                            <Text style={styles.mealCalorieText}>{Math.round(parseFloat(meal.totalCalories) || 0)} kcal</Text>
                          </View>
                        </View>
                        
                        {/* 菜品列表 */}
                        <View style={styles.dishesList}>
                          {meal.dishes?.map((dish, dishIndex) => {
                            const quantity = dish.quantityG || dish.quantity_g || 0;
                            const protein = dish.proteinG || dish.protein_g || 0;
                            const carbs = dish.carbsG || dish.carbs_g || 0;
                            const fat = dish.fatG || dish.fat_g || 0;
                            const cookingTip = dish.cookingTip || dish.cooking_tip;
                            
                            return (
                              <View key={dishIndex} style={styles.dishCard}>
                                {/* 菜品主信息 */}
                                <View style={styles.dishMainRow}>
                                  <View style={styles.dishInfo}>
                                    <Text style={styles.dishName}>{dish.name}</Text>
                                    <View style={styles.dishMetaRow}>
                                      <View style={styles.dishMetaItem}>
                                        <Ionicons name="scale-outline" size={12} color={Theme.colors.textMuted} />
                                        <Text style={styles.dishMetaText}>{quantity}g</Text>
                                      </View>
                                      {(protein > 0 || carbs > 0 || fat > 0) && (
                                        <>
                                          <View style={styles.dishMetaDivider} />
                                          <View style={styles.dishMetaItem}>
                                            <Text style={styles.dishNutritionText}>
                                              蛋{protein.toFixed(1)}g · 碳{carbs.toFixed(1)}g · 脂{fat.toFixed(1)}g
                                            </Text>
                                          </View>
                                        </>
                                      )}
                                    </View>
                                  </View>
                                  <View style={styles.dishCalorieBox}>
                                    <Text style={styles.dishCalorieNumber}>{dish.calories}</Text>
                                    <Text style={styles.dishCalorieUnit}>kcal</Text>
                                  </View>
                                </View>
                                
                                {/* 烹饪建议 */}
                                {cookingTip && (
                                  <View style={styles.cookingTipBox}>
                                    <Ionicons name="restaurant-outline" size={14} color={Theme.colors.textSecondary} />
                                    <Text style={styles.cookingTipText}>{cookingTip}</Text>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>

                        {/* 餐次营养汇总 */}
                        {meal.notes && (
                          <View style={styles.mealNotesBox}>
                            <Ionicons name="nutrition-outline" size={14} color={Theme.colors.primary} />
                            <Text style={styles.mealNotesText}>{meal.notes}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 操作按钮 */}
        {mealPlan.status !== 'active' && (
          <TouchableOpacity style={styles.activateBtn} onPress={handleActivatePlan}>
            <Text style={styles.activateBtnText}>应用此食谱</Text>
          </TouchableOpacity>
        )}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.page,
  },
  errorText: {
    fontSize: Theme.typography.sizes.h2,
    color: Theme.colors.danger,
    marginBottom: Theme.spacing.lg,
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
    fontWeight: Theme.typography.weights.medium,
  },
  overviewCard: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.card,
    margin: Theme.spacing.lg,
    padding: Theme.spacing.page,
    borderRadius: Theme.radius.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.page,
  },
  planTypeBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.xs,
  },
  aiBadge: {
    backgroundColor: Theme.colors.primaryLight,
  },
  customBadge: {
    backgroundColor: Theme.colors.highlight,
  },
  planTypeText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.medium,
  },
  aiBadgeText: {
    color: Theme.colors.primary,
  },
  customBadgeText: {
    color: Theme.colors.accent,
  },
  planStatus: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.success,
    fontWeight: Theme.typography.weights.medium,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  flavorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  flavorTag: {
    backgroundColor: Theme.colors.cream,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  flavorText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  section: {
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.lg,
  },
  dayCard: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.card,
    borderRadius: Theme.radius.lg,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  dayName: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  dayCalorieBadge: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  dayCalorieText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.semibold,
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
    marginBottom: Theme.spacing.compact,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  mealIcon: {
    fontSize: Theme.typography.sizes.h2,
  },
  mealType: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  mealCalorieBadge: {
    backgroundColor: Theme.colors.warning + '20',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.xs,
  },
  mealCalorieText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.warning,
    fontWeight: Theme.typography.weights.semibold,
  },
  dishesList: {
    gap: Theme.spacing.compact,
  },
  dishCard: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
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
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    flexWrap: 'wrap',
  },
  dishMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  dishMetaText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  dishMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Theme.colors.textMuted,
  },
  dishNutritionText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  dishCalorieBox: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  dishCalorieNumber: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.warning,
  },
  dishCalorieUnit: {
    fontSize: Theme.typography.sizes.tiny,
    color: Theme.colors.textMuted,
  },
  cookingTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.compact,
    paddingTop: Theme.spacing.compact,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cookingTipText: {
    flex: 1,
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  mealNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    backgroundColor: Theme.colors.primaryLight,
    padding: Theme.spacing.compact,
    borderRadius: Theme.radius.xs,
    marginTop: Theme.spacing.sm,
  },
  mealNotesText: {
    flex: 1,
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
  },
  activateBtn: {
    backgroundColor: Theme.colors.primary,
    margin: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  activateBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
  },
});

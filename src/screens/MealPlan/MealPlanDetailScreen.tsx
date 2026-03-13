import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
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

  const getMealTypeName = (type: string) => {
    const names: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return names[type] || type;
  };

  const getMealIcon = (type: string) => {
    const icons: Record<string, string> = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎',
    };
    return icons[type] || '🍽️';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
                {mealPlan.planType === 'ai' ? '🤖 AI生成' : '✏️ 自定义'}
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
                      color={Colors.textMuted} 
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
                            <Text style={styles.mealIcon}>{getMealIcon(meal.mealType)}</Text>
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
                                        <Ionicons name="scale-outline" size={12} color={Colors.textMuted} />
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
                                    <Ionicons name="restaurant-outline" size={14} color={Colors.textSecondary} />
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
                            <Ionicons name="nutrition-outline" size={14} color={Colors.primary} />
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
          <TouchableOpacity style={styles.activateBtn}>
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
    backgroundColor: Colors.background,
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
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  overviewCard: {
    backgroundColor: Colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiBadge: {
    backgroundColor: Colors.primaryLight,
  },
  customBadge: {
    backgroundColor: '#FEF3C7',
  },
  planTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  aiBadgeText: {
    color: Colors.primary,
  },
  customBadgeText: {
    color: '#D97706',
  },
  planStatus: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  flavorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  flavorTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flavorText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dayCalorieBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayCalorieText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayMealCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  dayContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mealSection: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealIcon: {
    fontSize: 16,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  mealCalorieBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mealCalorieText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
  },
  dishesList: {
    gap: 10,
  },
  dishCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
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
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  dishMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dishMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dishMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dishMetaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  dishNutritionText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dishCalorieBox: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  dishCalorieNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  dishCalorieUnit: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  cookingTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cookingTipText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  mealNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  mealNotesText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primary,
  },
  activateBtn: {
    backgroundColor: Colors.primary,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activateBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

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
      mealPlan?: MealPlan;  // 兼容旧的方式
    };
  };
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function MealPlanDetailScreen({ navigation, route }: MealPlanDetailScreenProps) {
  const { planId, mealPlan: initialMealPlan } = route.params || {};
  
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(initialMealPlan || null);
  const [isLoading, setIsLoading] = useState(!initialMealPlan && !!planId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果没有传入 mealPlan 但有 planId，则获取详情
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

  // 获取某天的所有餐次（处理后端的嵌套结构）
  const getDayData = (dayOfWeek: number): any[] => {
    if (!mealPlan?.days) return [];
    
    const day = mealPlan.days.find(d => d.dayOfWeek === dayOfWeek);
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

  const getMealTypeName = (type: string) => {
    const names: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return names[type] || type;
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
            const dayMeals = getDayData(index + 1);
            if (dayMeals.length === 0) return null;

            // 计算当天总热量
            const dayTotalCalories = dayMeals.reduce((sum, meal) => {
              const calories = parseFloat(meal.totalCalories) || 0;
              return sum + calories;
            }, 0);

            return (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{dayName}</Text>
                  <Text style={styles.dayCalories}>
                    {dayTotalCalories} kcal
                  </Text>
                </View>

                {dayMeals.map((meal, mealIndex) => (
                  <View key={mealIndex} style={styles.mealContainer}>
                    <Text style={styles.mealType}>{getMealTypeName(meal.mealType || 'breakfast')}</Text>
                    
                    {meal.dishes?.map((dish, dishIndex) => {
                      // 兼容后端返回的下划线命名和驼峰命名
                      const quantity = dish.quantityG || dish.quantity_g || 0;
                      const protein = dish.proteinG || dish.protein_g || 0;
                      const carbs = dish.carbsG || dish.carbs_g || 0;
                      const fat = dish.fatG || dish.fat_g || 0;
                      const cookingTip = dish.cookingTip || dish.cooking_tip;
                      
                      return (
                        <View key={dishIndex} style={styles.dishItem}>
                          <View style={styles.dishMain}>
                            <Text style={styles.dishName}>{dish.name}</Text>
                            <View style={styles.dishMeta}>
                              <Text style={styles.dishQuantity}>{quantity}g</Text>
                              {(protein > 0 || carbs > 0 || fat > 0) && (
                                <Text style={styles.dishNutrition}>
                                  蛋{protein}g·碳{carbs}g·脂{fat}g
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={styles.dishRight}>
                            <Text style={styles.dishCalories}>{dish.calories} kcal</Text>
                          </View>
                          {cookingTip && (
                            <Text style={styles.cookingTip}>💡 {cookingTip}</Text>
                          )}
                        </View>
                      );
                    })}

                    {meal.notes && (
                      <Text style={styles.mealNotes}>📊 {meal.notes}</Text>
                    )}
                  </View>
                ))}
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
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dayCalories: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  mealContainer: {
    marginBottom: 16,
  },
  mealType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dishInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dishName: {
    fontSize: 15,
    color: Colors.text,
  },
  dishQuantity: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  dishCalories: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '500',
  },
  cookingTip: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  dishMain: {
    flex: 1,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dishNutrition: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dishRight: {
    alignItems: 'flex-end',
  },
  mealNotes: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
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

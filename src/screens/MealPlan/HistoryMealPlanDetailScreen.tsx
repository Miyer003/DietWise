import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { MealPlanService } from '../../services/api';
import { MealPlan, MealPlanDay } from '../../types';

interface HistoryMealPlanDetailScreenProps {
  navigation: any;
  route: {
    params: {
      planId: string;
    };
  };
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MEAL_TYPES: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export default function HistoryMealPlanDetailScreen({ navigation, route }: HistoryMealPlanDetailScreenProps) {
  const { planId } = route.params;
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    loadPlanDetail();
  }, [planId]);

  const loadPlanDetail = async () => {
    setIsLoading(true);
    try {
      const res = await MealPlanService.getPlanById(planId);
      if (res.code === 0 && res.data) {
        setPlan(res.data);
      }
    } catch (error) {
      console.error('加载食谱详情失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayExpand = (dayOfWeek: number) => {
    setExpandedDays(prev =>
      prev.includes(dayOfWeek)
        ? prev.filter(d => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    );
  };

  const handleActivate = async () => {
    Alert.alert(
      '重新激活食谱',
      '激活此历史食谱将作为当前饮食计划，是否继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '激活',
          style: 'default',
          onPress: async () => {
            setIsActivating(true);
            try {
              const res = await MealPlanService.activatePlan(planId);
              if (res.code === 0) {
                Alert.alert('激活成功', '该食谱已设为当前饮食计划');
                navigation.navigate('MealPlan');
              } else {
                Alert.alert('激活失败', res.message || '请稍后重试');
              }
            } catch (error: any) {
              Alert.alert('激活失败', error.message || '请检查网络连接');
            } finally {
              setIsActivating(false);
            }
          },
        },
      ]
    );
  };

  const getDayData = (dayOfWeek: number) => {
    if (!plan?.days) return [];
    const day = plan.days.find((d: MealPlanDay) => d.dayOfWeek === dayOfWeek);
    if (!day) return [];

    if (day.meals) {
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

  const getDayTotalCalories = (dayOfWeek: number) => {
    const meals = getDayData(dayOfWeek);
    return meals.reduce((sum, meal) => sum + (parseFloat(meal.totalCalories as any) || 0), 0);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>历史食谱详情</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>历史食谱详情</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>食谱不存在或已被删除</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>历史食谱详情</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 状态卡片 */}
        <View style={[styles.statusCard, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: '#9CA3AF' }]}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
            <View>
              <Text style={styles.statusTitle}>已归档食谱</Text>
              <Text style={styles.statusSubtitle}>
                {(plan as any).type === 'ai' ? 'AI生成' : '自定义'}食谱 · 创建于{' '}
                {new Date((plan as any).createdAt || (plan as any).created_at).toLocaleDateString('zh-CN')}
              </Text>
            </View>
          </View>
          <View style={styles.statusStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(plan as any).calorieTarget || (plan as any).calorie_target}</Text>
              <Text style={styles.statLabel}>每日摄入(kcal)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(plan as any).mealCount || (plan as any).meal_count}</Text>
              <Text style={styles.statLabel}>每日餐数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(plan as any).healthGoal || (plan as any).health_goal}</Text>
              <Text style={styles.statLabel}>饮食目标</Text>
            </View>
          </View>
        </View>

        {/* 口味偏好 */}
        {((plan as any).flavorPrefs || (plan as any).flavor_prefs) && ((plan as any).flavorPrefs || (plan as any).flavor_prefs).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>口味偏好</Text>
            <View style={styles.preferencesCard}>
              <View style={styles.preferencesList}>
                {((plan as any).flavorPrefs || (plan as any).flavor_prefs).map((pref: string, index: number) => (
                  <View key={index} style={styles.prefTag}>
                    <Text style={styles.prefText}>{pref}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 每日菜单详情 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>一周菜单</Text>

          {WEEK_DAYS.map((dayName, index) => {
            const dayOfWeek = index + 1;
            const dayMeals = getDayData(dayOfWeek);
            if (dayMeals.length === 0) return null;

            const dayTotalCalories = getDayTotalCalories(dayOfWeek);
            const isExpanded = expandedDays.includes(dayOfWeek);

            return (
              <View key={dayOfWeek} style={styles.dayCard}>
                {/* 日期标题 - 可点击展开/收起 */}
                <TouchableOpacity
                  style={styles.dayHeader}
                  onPress={() => toggleDayExpand(dayOfWeek)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayHeaderLeft}>
                    <Text style={styles.dayName}>{dayName}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textMuted}
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                  <View style={styles.dayCalorieBadge}>
                    <Text style={styles.dayCalorieText}>{Math.round(dayTotalCalories)} kcal</Text>
                  </View>
                </TouchableOpacity>

                {/* 餐次列表 - 仅展开时显示 */}
                {isExpanded && dayMeals.map((meal, mealIndex) => (
                  <View key={mealIndex} style={styles.mealSection}>
                    <View style={styles.mealHeader}>
                      <View style={styles.mealTitleRow}>
                        <Text style={styles.mealIcon}>
                          {meal.mealType === 'breakfast' ? '🌅' :
                           meal.mealType === 'lunch' ? '☀️' :
                           meal.mealType === 'dinner' ? '🌙' : '🍎'}
                        </Text>
                        <Text style={styles.mealType}>{MEAL_TYPES[meal.mealType] || meal.mealType}</Text>
                      </View>
                      <Text style={styles.mealCalories}>{Math.round(parseFloat(meal.totalCalories as any) || 0)} kcal</Text>
                    </View>

                    {/* 菜品列表 - 只读 */}
                    {meal.dishes?.map((dish: any, dishIndex: number) => (
                      <View key={dishIndex} style={styles.dishRow}>
                        <View style={styles.dishViewRow}>
                          <Text style={styles.dishName}>{dish.name}</Text>
                          <View style={styles.dishMeta}>
                            <Text style={styles.dishQuantity}>{dish.quantity_g || dish.quantityG}g</Text>
                            <Text style={styles.dishCalories}>{dish.calories} kcal</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* 底部按钮 - 根据状态显示 */}
        {plan.status === 'active' ? (
          <View style={styles.currentUseBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.currentUseText}>当前正在使用此食谱</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.activateBtn, isActivating && { opacity: 0.7 }]}
            onPress={handleActivate}
            disabled={isActivating}
          >
            {isActivating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.activateBtnText}>重新激活此食谱</Text>
              </>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statusCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  preferencesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  preferencesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  prefTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  prefText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  mealSection: {
    marginTop: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  mealCalories: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
  },
  dishRow: {
    marginBottom: 8,
  },
  dishViewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 10,
  },
  dishName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dishQuantity: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dishCalories: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activateBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  activateBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  currentUseText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});

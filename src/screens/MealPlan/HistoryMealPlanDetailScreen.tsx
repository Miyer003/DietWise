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
import ScreenHeader from '../../components/ScreenHeader';
import { Theme } from '../../constants/Theme';
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
        <ScreenHeader title="历史食谱详情" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="历史食谱详情" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>食谱不存在或已被删除</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="历史食谱详情" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 状态卡片 */}
        <View style={[styles.statusCard, { backgroundColor: Theme.colors.cream, borderColor: Theme.colors.border }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: Theme.colors.textMuted }]}>
              <Ionicons name="cube-outline" size={28} color={Theme.colors.textMuted} />
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
                      color={Theme.colors.textMuted}
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
                        <Ionicons 
                          name={meal.mealType === 'breakfast' ? 'sunny-outline' :
                                meal.mealType === 'lunch' ? 'sunny' :
                                meal.mealType === 'dinner' ? 'moon-outline' : 'cafe-outline'}
                          size={16}
                          color={Theme.colors.textSecondary}
                        />
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
            <Ionicons name="checkmark-circle" size={20} color={Theme.colors.primary} style={{ marginRight: 8 }} />
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
    marginTop: Theme.spacing.compact,
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  statusCard: {
    margin: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.compact,
  },
  statusTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  statusSubtitle: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  statusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  section: {
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.compact,
  },
  preferencesCard: {
    backgroundColor: 'white',
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  preferencesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.compact,
  },
  prefTag: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.xl,
  },
  prefText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.compact,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.compact,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: Theme.typography.sizes.body,
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
  mealSection: {
    marginTop: Theme.spacing.lg,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.compact,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  mealIcon: {
    fontSize: Theme.typography.sizes.body,
  },
  mealType: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  mealCalories: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.warning,
    fontWeight: Theme.typography.weights.semibold,
  },
  dishRow: {
    marginBottom: Theme.spacing.sm,
  },
  dishViewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.compact,
    borderRadius: Theme.radius.sm,
  },
  dishName: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.compact,
  },
  dishQuantity: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  dishCalories: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.medium,
  },
  activateBtn: {
    backgroundColor: Theme.colors.primary,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.button,
  },
  activateBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
  },
  currentUseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
    paddingVertical: Theme.spacing.lg,
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  currentUseText: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.primary,
  },
});

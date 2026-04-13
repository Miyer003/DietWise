import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { Theme } from '../../constants/Theme';
import { MealPlanService } from '../../services/api';
import { MealPlan } from '../../types';

interface HistoryMealPlanListScreenProps {
  navigation: any;
}

export default function HistoryMealPlanListScreen({ navigation }: HistoryMealPlanListScreenProps) {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const res = await MealPlanService.getPlans({ limit: 50 });
      if (res.code === 0 && res.data) {
        // 显示所有食谱（包括当前激活的和已归档的）
        const allPlans = (res.data as any).items || res.data.plans || [];
        // 按创建时间倒序排列，active 的排在最前面
        allPlans.sort((a: MealPlan, b: MealPlan) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setPlans(allPlans);
      }
    } catch (error) {
      console.error('加载历史食谱失败:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadPlans();
      setIsLoading(false);
    };
    init();
  }, [loadPlans]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPlans();
    setIsRefreshing(false);
  }, [loadPlans]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="历史食谱" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="历史食谱" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>暂无历史食谱</Text>
            <Text style={styles.emptyDesc}>您使用过的食谱会保存在这里</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listHint}>共 {plans.length} 个历史食谱</Text>
            {plans.map((plan, index) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => navigation.navigate('HistoryMealPlanDetail', { planId: plan.id })}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>
                      {(plan as any).type === 'ai' ? 'AI生成' : '自定义'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    plan.status === 'active' && styles.statusBadgeActive
                  ]}>
                    <Text style={[
                      styles.statusText,
                      plan.status === 'active' && styles.statusTextActive
                    ]}>
                      {plan.status === 'active' ? '使用中' : '已归档'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>每日热量</Text>
                      <Text style={styles.infoValue}>{(plan as any).calorieTarget || (plan as any).calorie_target} kcal</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>每日餐数</Text>
                      <Text style={styles.infoValue}>{(plan as any).mealCount || (plan as any).meal_count} 餐</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>饮食目标</Text>
                      <Text style={styles.infoValue}>{(plan as any).healthGoal || (plan as any).health_goal}</Text>
                    </View>
                  </View>

                  {((plan as any).flavorPrefs || (plan as any).flavor_prefs) && ((plan as any).flavorPrefs || (plan as any).flavor_prefs).length > 0 && (
                    <View style={styles.prefsRow}>
                      {((plan as any).flavorPrefs || (plan as any).flavor_prefs).slice(0, 4).map((pref: string, idx: number) => (
                        <View key={idx} style={styles.prefTag}>
                          <Text style={styles.prefText}>{pref}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>创建于 {formatDate(plan.createdAt)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Theme.colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingTop: 120,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  emptyDesc: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  listContainer: {
    padding: Theme.spacing.lg,
  },
  listHint: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.compact,
  },
  planCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.compact,
  },
  typeBadge: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  typeText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  statusBadge: {
    backgroundColor: Theme.colors.cream,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  statusBadgeActive: {
    backgroundColor: Theme.colors.primaryLight,
  },
  statusText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  statusTextActive: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  cardBody: {
    marginBottom: Theme.spacing.compact,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.compact,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  infoValue: {
    fontSize: Theme.typography.sizes.h3,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  prefsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  prefTag: {
    backgroundColor: Theme.colors.cream,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
  },
  prefText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Theme.spacing.compact,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
  },
});

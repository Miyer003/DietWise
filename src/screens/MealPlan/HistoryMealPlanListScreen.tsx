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
import Colors from '../../constants/Colors';
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
        const allPlans = res.data.items || res.data.plans || [];
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>历史食谱</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
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
        <Text style={styles.headerTitle}>历史食谱</Text>
        <View style={{ width: 24 }} />
      </View>

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
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
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
    paddingTop: 120,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContainer: {
    padding: 16,
  },
  listHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  planCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: Colors.primaryLight,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  prefsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prefTag: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  prefText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});

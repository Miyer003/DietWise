import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '../../constants/Theme';
import { useAuth } from '../../store/AuthContext';
import { UserService, DietService } from '../../services/api';
import { Achievement, DailySummary } from '../../types';
import { format } from 'date-fns';

interface UserStats {
  totalRecords: number;
  streakDays: number;
  joinDays: number;
  joinDate: string;
}

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, logout } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyData, setDailyData] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const menuItems = [
    { icon: 'person-outline', title: '个人画像', screen: 'ProfileEdit' },
    { icon: 'restaurant-outline', title: '我的食谱', screen: 'MealPlan' },
    { icon: 'chatbubble-outline', title: '意见反馈', screen: 'Feedback' },
  ];

  const loadData = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [achievementsRes, statsRes, dailyRes] = await Promise.all([
        UserService.getAchievements(),
        UserService.getStats(),
        DietService.getDailySummary(today),
      ]);

      if (achievementsRes.code === 0 && achievementsRes.data) {
        setAchievements(achievementsRes.data.achievements || []);
      }

      if (statsRes.code === 0 && statsRes.data) {
        setStats(statsRes.data as UserStats);
      }

      if (dailyRes.code === 0 && dailyRes.data) {
        setDailyData(dailyRes.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    init();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // 计算今日摄入进度
  const calorieProgress = dailyData && dailyData.calorieGoal > 0
    ? Math.min((dailyData.calorieConsumed / dailyData.calorieGoal) * 100, 100)
    : 0;

  // 获取健康目标文本
  const getHealthGoalText = () => {
    const goal = profile?.healthGoal;
    if (goal === '减脂') return '减脂模式';
    if (goal === '增肌') return '增肌模式';
    return '维持模式';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部个人信息卡片 */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : user?.avatarEmoji ? (
                  <Text style={styles.avatarEmoji}>{user.avatarEmoji}</Text>
                ) : (
                  <Text style={styles.avatarText}>
                    {(user?.nickname || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={() => navigation.navigate('ProfileEdit')}
              >
                <Ionicons name="camera" size={14} color={Theme.colors.textInverse} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.nickname}>{user?.nickname || '用户'}</Text>
              <View style={styles.userMetaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{getHealthGoalText()}</Text>
                </View>
                {profile?.weightKg && (
                  <Text style={styles.weightText}>{profile.weightKg}kg</Text>
                )}
              </View>
              {profile?.bio ? (
                <Text style={styles.bioText} numberOfLines={2}>{profile.bio}</Text>
              ) : (
                <Text style={styles.bioPlaceholder}>点击编辑添加个性签名</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('ProfileEdit')}
            >
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 今日摄入进度 */}
          <View style={styles.todaySection}>
            <View style={styles.todayHeader}>
              <Text style={styles.todayLabel}>今日摄入</Text>
              <Text style={styles.todayValue}>
                {Math.round(dailyData?.calorieConsumed || 0)} / {dailyData?.calorieGoal || profile?.dailyCalorieGoal || 2000} kcal
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${calorieProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{Math.round(calorieProgress)}%</Text>
            </View>
          </View>

          {/* 统计信息 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.totalRecords || 0}</Text>
              <Text style={styles.statLabel}>总记录</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.streakDays || 0}</Text>
              <Text style={styles.statLabel}>连续打卡</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.joinDays || 0}</Text>
              <Text style={styles.statLabel}>加入天数</Text>
            </View>
          </View>
        </View>

        {/* 成就徽章区域 */}
        <TouchableOpacity 
          style={styles.section}
          onPress={() => navigation.navigate('Achievements')}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>成就徽章</Text>
            <View style={styles.sectionHeaderRight}>
              <Text style={styles.badgeCount}>{achievements.length}/12</Text>
              <Ionicons name="chevron-forward" size={18} color={Theme.colors.textMuted} />
            </View>
          </View>
          
          {achievements.length > 0 ? (
            <View style={styles.badgesRow}>
              {achievements.slice(0, 4).map((achievement, index) => (
                <View 
                  key={index} 
                  style={[styles.badgeIcon, { backgroundColor: achievement.iconColor + '20' }]}
                >
                  <Text style={{ fontSize: 20 }}>{achievement.iconEmoji || '🏆'}</Text>
                </View>
              ))}
              {achievements.length < 4 && (
                <View style={[styles.badgeIcon, styles.badgeLocked]}>
                  <Ionicons name="lock-closed" size={18} color={Theme.colors.textMuted} />
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>还没有解锁徽章，快去记录饮食吧</Text>
          )}
        </TouchableOpacity>

        {/* 功能菜单 */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={20} color={Theme.colors.primary} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Theme.colors.danger} />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
  headerCard: {
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.page,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.xs,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.textInverse,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    backgroundColor: Theme.colors.primaryDark,
    borderRadius: Theme.radius.none,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: Theme.spacing.lg,
  },
  nickname: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.light,
    letterSpacing: 1,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.compact,
  },
  metaBadge: {
    backgroundColor: Theme.colors.subtle,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.none,
  },
  metaBadgeText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  weightText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  bioText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    lineHeight: 18,
  },
  bioPlaceholder: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.xs,
  },
  userId: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
  },
  editButton: {
    padding: Theme.spacing.sm,
  },
  todaySection: {
    marginTop: Theme.spacing.page,
    paddingTop: Theme.spacing.page,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.compact,
  },
  todayLabel: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  todayValue: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.compact,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: Theme.colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
  },
  progressText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.primary,
    minWidth: 36,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Theme.spacing.xl,
    paddingTop: Theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Theme.colors.divider,
  },
  statValue: {
    fontSize: 24,
    fontWeight: Theme.typography.weights.light,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
  },
  section: {
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.card,
    marginBottom: Theme.spacing.compact,
    padding: Theme.spacing.page,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.light,
    letterSpacing: 1,
    color: Theme.colors.text,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  badgeCount: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: Theme.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLocked: {
    backgroundColor: Theme.colors.subtle,
  },
  emptyText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textMuted,
  },
  menuSection: {
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.card,
    marginBottom: Theme.spacing.compact,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.page,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: Theme.colors.subtle,
    borderRadius: Theme.radius.none,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.compact,
  },
  menuText: {
    flex: 1,
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.text,
  },
  logoutButton: {
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.card,
    marginTop: Theme.spacing.compact,
    padding: Theme.spacing.lg,
    gap: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  logoutText: {
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.danger,
    fontWeight: Theme.typography.weights.medium,
  },

});

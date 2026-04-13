import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
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
    { icon: 'notifications-outline', title: '提醒设置', screen: 'NotificationSettings' },
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
                <Ionicons name="camera" size={14} color={Colors.textInverse} />
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
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
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
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
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
                  <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
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
                <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <Text style={styles.version}>膳智 DietWise v2.0</Text>
        <View style={{ height: 32 }} />
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
  headerCard: {
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
  },
  avatarContainer: {
    width: 72,
    height: 72,
    backgroundColor: Colors.primary,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    backgroundColor: Colors.primaryDark,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nickname: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  weightText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bioText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  bioPlaceholder: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  editButton: {
    padding: 8,
  },
  todaySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  todayLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  todayValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
    minWidth: 36,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.divider,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  section: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeCount: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLocked: {
    backgroundColor: Colors.elevated,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  menuSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    color: Colors.danger,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 24,
  },
});

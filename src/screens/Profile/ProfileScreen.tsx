import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';
import { UserService, AuthService } from '../../services/api';
import { Achievement } from '../../types';

// 用户统计数据类型
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const menuItems = [
    { icon: '👤', title: '个人画像', color: '#818CF8', screen: 'ProfileEdit', isTab: false },
    { icon: '🥡', title: '我的食谱', color: Colors.warning, screen: 'MealPlan', isTab: false },
    { icon: '📊', title: '详细数据报告', color: '#60A5FA', screen: 'AnalyticsTab', params: { initialTab: 3 }, isTab: true },
    { icon: '💡', title: '个性化提示库', color: '#F472B6', screen: 'TipLibrary', isTab: false },
    { icon: '🔔', title: '提醒设置', color: Colors.warning, screen: 'NotificationSettings', isTab: false },
  ];

  // 加载成就徽章和统计数据
  const loadData = useCallback(async () => {
    try {
      const [achievementsRes, statsRes] = await Promise.all([
        UserService.getAchievements(),
        UserService.getStats(),
      ]);

      if (achievementsRes.code === 0 && achievementsRes.data) {
        setAchievements(achievementsRes.data.achievements || []);
      }

      if (statsRes.code === 0 && statsRes.data) {
        setStats(statsRes.data as UserStats);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    init();
  }, [loadData]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  // 处理退出登录
  const handleLogout = useCallback(async () => {
    Alert.alert(
      '确认退出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '退出', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('退出登录失败:', error);
            }
          }
        },
      ]
    );
  }, [logout]);

  // 获取AI生成的饮食画像标签
  const getPortraitTags = () => {
    const tags: { name: string; bgColor: string; textColor: string; icon: string }[] = [];
    
    // 基于用户画像数据生成标签
    if (profile?.aiPortraitTags && profile.aiPortraitTags.length > 0) {
      const tagColors = [
        { bg: '#FFEDD5', text: '#C2410C' },
        { bg: '#DBEAFE', text: '#1E40AF' },
        { bg: '#FEE2E2', text: '#991B1B' },
        { bg: '#D1FAE5', text: '#065F46' },
      ];
      
      profile.aiPortraitTags.forEach((tag, index) => {
        const colors = tagColors[index % tagColors.length];
        // 根据标签内容选择合适的图标
        let icon = '🏷️';
        if (tag.includes('早餐')) icon = '🍳';
        else if (tag.includes('蛋白')) icon = '🥩';
        else if (tag.includes('碳')) icon = '🍞';
        else if (tag.includes('辣')) icon = '🌶️';
        else if (tag.includes('蔬菜')) icon = '🥬';
        else if (tag.includes('糖')) icon = '🍬';
        
        tags.push({
          name: tag,
          bgColor: colors.bg,
          textColor: colors.text,
          icon,
        });
      });
    }
    
    // 如果没有标签，显示基于健康目标的默认标签
    if (tags.length === 0 && profile?.healthGoal) {
      const goalMap: Record<string, { name: string; icon: string; bg: string; text: string }> = {
        '减脂': { name: '减脂达人', icon: '🔥', bg: '#FFEDD5', text: '#C2410C' },
        '增肌': { name: '增肌先锋', icon: '💪', bg: '#DBEAFE', text: '#1E40AF' },
        '维持': { name: '均衡饮食', icon: '⚖️', bg: '#D1FAE5', text: '#065F46' },
      };
      const goal = goalMap[profile.healthGoal];
      if (goal) {
        tags.push({
          name: goal.name,
          bgColor: goal.bg,
          textColor: goal.text,
          icon: goal.icon,
        });
      }
    }
    
    // 添加饮食偏好标签
    if (profile?.flavorPrefs && profile.flavorPrefs.length > 0) {
      const pref = profile.flavorPrefs[0];
      tags.push({
        name: pref,
        bgColor: '#FEE2E2',
        textColor: '#991B1B',
        icon: '👅',
      });
    }
    
    return tags.length > 0 ? tags : [
      { name: '膳智用户', bgColor: '#F3F4F6', textColor: '#6B7280', icon: '🌟' },
    ];
  };

  // 获取AI分析描述
  const getPortraitDesc = () => {
    if (profile?.bio) {
      return profile.bio;
    }
    
    const goals: Record<string, string> = {
      '减脂': '您选择了减脂目标，建议控制热量摄入，增加蛋白质比例，保持适量运动。',
      '增肌': '您选择了增肌目标，建议增加蛋白质和碳水化合物摄入，配合力量训练。',
      '维持': '您选择了维持目标，建议保持均衡饮食，注意营养搭配。',
    };
    
    return goals[profile?.healthGoal || '维持'] || '完善您的个人画像，获取更精准的饮食建议。';
  };

  const portraitTags = getPortraitTags();
  const portraitDesc = getPortraitDesc();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* 顶部个人信息卡片 */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>{user?.avatarEmoji || '😊'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.nickname}>{user?.nickname || '膳智用户'}</Text>
              <Text style={styles.userId}>ID: {user?.id?.slice(0, 8) || '--'}</Text>
              <Text style={styles.joinDays}>加入膳智 {stats?.joinDays || 0} 天</Text>
            </View>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => navigation.navigate('ProfileEdit')}
            >
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 饮食画像 */}
        <View style={styles.portraitCard}>
          <View style={styles.portraitHeader}>
            <Text style={styles.portraitTitle}>🏷️ 我的饮食画像</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI生成</Text>
            </View>
          </View>
          <View style={styles.tagsContainer}>
            {portraitTags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: tag.bgColor }]}>
                <Text style={[styles.tagText, { color: tag.textColor }]}>
                  {tag.icon} {tag.name}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.portraitDesc}>
            个人标签：{portraitDesc}
          </Text>
        </View>

        {/* 成就徽章 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 成就徽章</Text>
            <Text style={styles.badgeCount}>{achievements.length}/12</Text>
          </View>
          {achievements.length > 0 ? (
            <View style={styles.badgesContainer}>
              {achievements.slice(0, 4).map((achievement, index) => (
                <View key={index} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, { backgroundColor: achievement.iconColor || '#FCD34D' }]}>
                    <Text style={styles.badgeEmoji}>{achievement.iconEmoji}</Text>
                  </View>
                  <Text style={styles.badgeName}>{achievement.badgeName}</Text>
                </View>
              ))}
              {/* 未解锁的徽章用锁图标填充 */}
              {achievements.length < 4 && Array.from({ length: 4 - achievements.length }).map((_, index) => (
                <View key={`locked-${index}`} style={styles.badgeItem}>
                  <View style={[styles.badgeIcon, styles.badgeLocked]}>
                    <Text style={[styles.badgeEmoji, styles.badgeEmojiLocked]}>🔒</Text>
                  </View>
                  <Text style={[styles.badgeName, styles.badgeNameLocked]}>未解锁</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBadges}>
              <Text style={styles.emptyBadgesText}>还没有解锁任何徽章，快去记录饮食吧！</Text>
            </View>
          )}
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.menuItem}
              onPress={() => {
                if (item.isTab) {
                  // 导航到 Tab 导航器中的屏幕
                  navigation.navigate('Main', {
                    screen: item.screen,
                    params: item.params || {},
                  });
                } else {
                  // 直接导航到 Stack 屏幕
                  navigation.navigate(item.screen, item.params || {});
                }
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 退出登录 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 退出登录</Text>
        </TouchableOpacity>

        <Text style={styles.version}>膳智 DietWise v2.0.0</Text>
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
  headerCard: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userId: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  joinDays: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  editBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 4,
  },
  portraitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  portraitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  aiBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  portraitDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  badgeCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  badgeItem: {
    alignItems: 'center',
    width: 70,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#FCD34D',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  badgeLocked: {
    backgroundColor: '#E5E7EB',
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeEmojiLocked: {
    opacity: 0.5,
  },
  badgeName: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeNameLocked: {
    color: Colors.textMuted,
  },
  emptyBadges: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
  },
  emptyBadgesText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  logoutBtn: {
    margin: 16,
    marginTop: 24,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';

export default function ProfileScreen({ navigation }: any) {
  const { user, profile } = useAuth();

  const menuItems = [
    { icon: '👤', title: '个人画像', color: '#818CF8', screen: 'ProfileEdit' },
    { icon: '🥡', title: '我的食谱', color: Colors.warning, screen: 'MealPlan' },
    { icon: '📊', title: '详细数据报告', color: '#60A5FA', screen: 'Analytics' },
    { icon: '💡', title: '个性化提示库', color: '#F472B6', screen: 'TipLibrary' },
    { icon: '🔔', title: '提醒设置', color: Colors.warning, screen: 'NotificationSettings' },
  ];

  const badges = [
    { icon: '🔥', name: '连续7天\n记录', unlocked: true },
    { icon: '⚖️', name: '营养均衡\n达标', unlocked: true },
    { icon: '🍬', name: '控糖\n卫士', unlocked: true },
    { icon: '🥬', name: '蔬菜\n达人', unlocked: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 顶部个人信息卡片 */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>{user?.avatar_emoji || '😊'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.nickname}>{user?.nickname || 'User'}</Text>
              <Text style={styles.userId}>ID: {user?.id || '12345678'}</Text>
              <Text style={styles.joinDays}>加入膳智 15 天</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
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
            <View style={[styles.tag, { backgroundColor: '#FFEDD5' }]}>
              <Text style={[styles.tagText, { color: '#C2410C' }]}>🍳 早餐战士</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.tagText, { color: '#1E40AF' }]}>⚖️ 低碳先锋</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.tagText, { color: '#991B1B' }]}>🌶️ 爱吃辣</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.tagText, { color: '#065F46' }]}>🥩 蛋白质爱好者</Text>
            </View>
          </View>
          <Text style={styles.portraitDesc}>
            AI分析：您坚持吃早餐的习惯非常好，但蔬菜摄入频率偏低，建议增加深色蔬菜比例。
          </Text>
        </View>

        {/* 成就徽章 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 成就徽章</Text>
            <Text style={styles.badgeCount}>4/12</Text>
          </View>
          <View style={styles.badgesContainer}>
            {badges.map((badge, index) => (
              <View key={index} style={styles.badgeItem}>
                <View style={[styles.badgeIcon, !badge.unlocked && styles.badgeLocked]}>
                  <Text style={[styles.badgeEmoji, !badge.unlocked && styles.badgeEmojiLocked]}>
                    {badge.unlocked ? badge.icon : '🔒'}
                  </Text>
                </View>
                <Text style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
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
        <TouchableOpacity style={styles.logoutBtn}>
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
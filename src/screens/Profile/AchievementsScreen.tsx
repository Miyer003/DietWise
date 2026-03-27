import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { UserService } from '../../services/api';
import { Achievement } from '../../types';

const { width } = Dimensions.get('window');

interface BadgeDefinition {
  badgeCode: string;
  badgeName: string;
  badgeDesc: string;
  iconEmoji: string;
  iconColor: string;
  category: string;
  conditionType: string;
  conditionValue: number;
}

// 用户成就展示用（合并了徽章定义和解锁状态）
interface UserAchievement {
  badgeCode: string;
  badgeName: string;
  badgeDesc?: string;
  iconEmoji: string;
  iconColor: string;
  category: string;
  conditionType: string;
  conditionValue: number;
  unlockedAt?: string;
  isNew?: boolean;
  isUnlocked: boolean;
}

export default function AchievementsScreen({ navigation }: any) {
  const [badges, setBadges] = useState<UserAchievement[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<UserAchievement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      // 获取用户已解锁的成就
      // API 响应格式: {code: 0, message: 'success', data: {total, achievements}}
      const achievementsRes = await UserService.getAchievements('all') as any;
      // axios 拦截器返回的是 response.data
      const unlockedBadges = achievementsRes?.data?.achievements || [];
      
      console.log('📊 已解锁徽章:', unlockedBadges.length, unlockedBadges.map((b: any) => b.badgeCode));
      
      // 获取所有徽章定义
      // 注意：admin/badges 需要认证，改用公开端点或从 UserService 获取
      // 由于徽章定义是公开的，我们使用一个特殊的公开接口或者硬编码默认定义
      // 暂时使用后端返回的徽章定义（如果有的话），否则使用默认定义
      
      // 检查 achievementsRes 是否包含徽章定义（后端扩展返回）
      let allBadgeDefs: BadgeDefinition[] = achievementsRes?.data?.badgeDefinitions || [];
      
      // 如果没有返回定义，尝试从其他接口获取
      // TODO: 后端可以提供一个公开接口获取所有徽章定义
      if (allBadgeDefs.length === 0) {
        console.log('后端未返回徽章定义，使用本地默认值');
      }
      
      // 如果仍然没有定义，根据已解锁的徽章推断定义，或使用硬编码
      if (allBadgeDefs.length === 0) {
        // 从已解锁的徽章中提取定义信息
        allBadgeDefs = unlockedBadges.map((ub: any) => ({
          badgeCode: ub.badgeCode,
          badgeName: ub.badgeName,
          badgeDesc: ub.badgeDesc,
          iconEmoji: ub.iconEmoji,
          iconColor: ub.iconColor,
          category: ub.category || 'general',
          conditionType: ub.conditionType || 'default',
          conditionValue: ub.conditionValue || 0,
        }));
        
        // 添加完整的默认徽章定义（与后端数据库保持一致）
        const defaultLockedBadges: BadgeDefinition[] = [
          // 连续记录类
          { badgeCode: 'streak_3', badgeName: '连续3天', badgeDesc: '坚持记录3天', iconEmoji: '🔥', iconColor: '#F59E0B', category: 'continuous', conditionType: 'streak_days', conditionValue: 3 },
          { badgeCode: 'streak_7', badgeName: '连续7天', badgeDesc: '坚持记录7天', iconEmoji: '🔥', iconColor: '#F97316', category: 'continuous', conditionType: 'streak_days', conditionValue: 7 },
          { badgeCode: 'streak_14', badgeName: '连续14天', badgeDesc: '坚持记录14天', iconEmoji: '🔥', iconColor: '#EF4444', category: 'continuous', conditionType: 'streak_days', conditionValue: 14 },
          { badgeCode: 'streak_30', badgeName: '连续30天', badgeDesc: '坚持记录30天', iconEmoji: '👑', iconColor: '#DC2626', category: 'continuous', conditionType: 'streak_days', conditionValue: 30 },
          { badgeCode: 'streak_100', badgeName: '百日坚持', badgeDesc: '坚持记录100天', iconEmoji: '💯', iconColor: '#991B1B', category: 'continuous', conditionType: 'streak_days', conditionValue: 100 },
          
          // 均衡饮食类
          { badgeCode: 'balanced_diet', badgeName: '营养均衡', badgeDesc: '连续3天营养均衡', iconEmoji: '⚖️', iconColor: '#10B981', category: 'balanced', conditionType: 'balanced_days', conditionValue: 3 },
          { badgeCode: 'sugar_control', badgeName: '控糖达人', badgeDesc: '连续7天控糖', iconEmoji: '🍬', iconColor: '#3B82F6', category: 'balanced', conditionType: 'sugar_control_days', conditionValue: 7 },
          { badgeCode: 'calorie_perfect', badgeName: '热量达标', badgeDesc: '连续5天热量达标', iconEmoji: '🎯', iconColor: '#8B5CF6', category: 'balanced', conditionType: 'calorie_perfect_days', conditionValue: 5 },
          { badgeCode: 'protein_master', badgeName: '蛋白质达人', badgeDesc: '连续7天蛋白质摄入达标', iconEmoji: '🥩', iconColor: '#F59E0B', category: 'balanced', conditionType: 'protein_days', conditionValue: 7 },
          
          // 习惯养成类
          { badgeCode: 'first_record', badgeName: '初次记录', badgeDesc: '完成首次饮食记录', iconEmoji: '📝', iconColor: '#6366F1', category: 'habit', conditionType: 'record_count', conditionValue: 1 },
          { badgeCode: 'record_10', badgeName: '记录新手', badgeDesc: '累计记录10次', iconEmoji: '📊', iconColor: '#8B5CF6', category: 'habit', conditionType: 'record_count', conditionValue: 10 },
          { badgeCode: 'record_50', badgeName: '记录达人', badgeDesc: '累计记录50次', iconEmoji: '📈', iconColor: '#EC4899', category: 'habit', conditionType: 'record_count', conditionValue: 50 },
          { badgeCode: 'record_100', badgeName: '记录大师', badgeDesc: '累计记录100次', iconEmoji: '🏆', iconColor: '#F59E0B', category: 'habit', conditionType: 'record_count', conditionValue: 100 },
          { badgeCode: 'photo_master', badgeName: '拍照大师', badgeDesc: '拍照识别20次', iconEmoji: '📸', iconColor: '#EC4899', category: 'habit', conditionType: 'photo_count', conditionValue: 20 },
          { badgeCode: 'chat_enthusiast', badgeName: '咨询达人', badgeDesc: 'AI咨询10次', iconEmoji: '💬', iconColor: '#14B8A6', category: 'habit', conditionType: 'chat_count', conditionValue: 10 },
          { badgeCode: 'early_bird', badgeName: '早起鸟', badgeDesc: '连续7天在8点前记录早餐', iconEmoji: '🌅', iconColor: '#F59E0B', category: 'habit', conditionType: 'early_record', conditionValue: 7 },
          { badgeCode: 'veggie_lover', badgeName: '蔬菜爱好者', badgeDesc: '累计摄入蔬菜30次', iconEmoji: '🥬', iconColor: '#22C55E', category: 'habit', conditionType: 'veggie_count', conditionValue: 30 },
          { badgeCode: 'water_tracker', badgeName: '喝水达人', badgeDesc: '连续7天喝水达标', iconEmoji: '💧', iconColor: '#3B82F6', category: 'habit', conditionType: 'water_days', conditionValue: 7 },
        ];
        
        // 合并，避免重复
        const existingCodes = new Set(allBadgeDefs.map(b => b.badgeCode));
        defaultLockedBadges.forEach(b => {
          if (!existingCodes.has(b.badgeCode)) {
            allBadgeDefs.push(b);
          }
        });
      }

      console.log('🏅 徽章定义总数:', allBadgeDefs.length);

      // 合并数据
      const mergedBadges: UserAchievement[] = allBadgeDefs.map((def) => {
        const unlocked = unlockedBadges.find(
          (ub: Achievement) => ub.badgeCode === def.badgeCode
        );
        return {
          ...def,
          unlockedAt: unlocked?.unlockedAt,
          isNew: unlocked?.isNew || false,
          isUnlocked: !!unlocked,
        };
      });

      console.log('✅ 合并后徽章总数:', mergedBadges.length, '已解锁:', mergedBadges.filter(b => b.isUnlocked).length);
      setBadges(mergedBadges);
    } catch (error) {
      console.error('加载徽章失败:', error);
    }
  };

  const handleBadgePress = (badge: UserAchievement) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  const filteredBadges = badges.filter((badge) => {
    if (activeFilter === 'unlocked') return badge.isUnlocked;
    if (activeFilter === 'locked') return !badge.isUnlocked;
    return true;
  });

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  // 获取分类标签 - 与后端保持一致
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      continuous: '连续记录',
      balanced: '均衡饮食',
      habit: '习惯养成',
      general: '综合成就',
    };
    return labels[category] || category;
  };

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      continuous: '🔥',
      balanced: '⚖️',
      habit: '🌟',
      general: '🏆',
    };
    return icons[category] || '🏆';
  };

  // 获取解锁条件描述 - 完整的条件类型映射
  const getConditionText = (badge: UserAchievement) => {
    const { conditionType, conditionValue, badgeCode } = badge;
    
    // 根据 conditionType 生成描述
    switch (conditionType) {
      case 'streak_days':
        return `连续记录 ${conditionValue} 天饮食`;
      case 'balanced_days':
        return `连续 ${conditionValue} 天营养均衡`;
      case 'sugar_control_days':
        return `连续 ${conditionValue} 天控糖达标`;
      case 'calorie_perfect_days':
        return `连续 ${conditionValue} 天热量达标`;
      case 'record_count':
        return `累计记录 ${conditionValue} 次饮食`;
      case 'photo_count':
        return `拍照识别 ${conditionValue} 次食物`;
      case 'chat_count':
        return `AI咨询 ${conditionValue} 次`;
      case 'meal_plan_count':
        return `生成 ${conditionValue} 次食谱`;
      case 'early_record':
        return `${conditionValue} 天在8点前记录早餐`;
      case 'veggie_lover':
        return `累计摄入蔬菜 ${conditionValue} 次`;
      case 'protein_master':
        return `累计摄入高蛋白食物 ${conditionValue} 次`;
      case 'water_tracker':
        return `连续 ${conditionValue} 天喝水达标`;
      default:
        // 根据 badgeCode 推断
        if (badgeCode?.includes('streak')) {
          const days = badgeCode.split('_')[1];
          return `连续记录 ${days} 天饮食`;
        }
        if (badgeCode?.includes('photo')) {
          return `拍照识别食物达到要求`;
        }
        if (badgeCode?.includes('chat')) {
          return `与AI营养师咨询达到要求`;
        }
        return badge.badgeDesc || '完成指定任务解锁';
    }
  };

  // 获取徽章难度等级
  const getBadgeDifficulty = (badge: UserAchievement) => {
    const { conditionValue, conditionType } = badge;
    
    if (conditionType === 'streak_days') {
      if (conditionValue >= 30) return { level: '困难', color: '#EF4444' };
      if (conditionValue >= 7) return { level: '中等', color: '#F59E0B' };
      return { level: '简单', color: '#10B981' };
    }
    if (conditionType === 'record_count' && conditionValue >= 50) {
      return { level: '困难', color: '#EF4444' };
    }
    if (conditionValue >= 20) {
      return { level: '中等', color: '#F59E0B' };
    }
    return { level: '简单', color: '#10B981' };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 成就徽章</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 进度概览 */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>收集进度</Text>
          <Text style={styles.progressCount}>
            {unlockedCount}/{badges.length}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(unlockedCount / badges.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          已解锁 {unlockedCount} 个徽章，继续加油！
        </Text>
      </View>

      {/* 筛选标签 */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: '全部' },
          { key: 'unlocked', label: '已解锁' },
          { key: 'locked', label: '未解锁' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.key as any)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 徽章列表 */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.badgesGrid}>
          {filteredBadges.map((badge, index) => (
            <TouchableOpacity
              key={badge.badgeCode}
              style={[
                styles.badgeCard,
                !badge.isUnlocked && styles.badgeCardLocked,
              ]}
              onPress={() => handleBadgePress(badge)}
            >
              <View
                style={[
                  styles.badgeIcon,
                  {
                    backgroundColor: badge.isUnlocked
                      ? badge.iconColor
                      : '#E5E7EB',
                  },
                ]}
              >
                <Text style={styles.badgeEmoji}>{badge.iconEmoji}</Text>
                {badge.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.badgeName,
                  !badge.isUnlocked && styles.badgeNameLocked,
                ]}
                numberOfLines={1}
              >
                {badge.badgeName}
              </Text>
              <Text style={styles.badgeCategory}>
                {getCategoryLabel(badge.category)}
              </Text>
              {!badge.isUnlocked && (
                <View style={styles.lockedOverlay}>
                  <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 徽章详情弹窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBadge && (
              <>
                {/* 徽章图标 */}
                <View
                  style={[
                    styles.modalIcon,
                    {
                      backgroundColor: selectedBadge.isUnlocked
                        ? selectedBadge.iconColor
                        : '#E5E7EB',
                    },
                  ]}
                >
                  <Text style={styles.modalEmoji}>
                    {selectedBadge.iconEmoji}
                  </Text>
                  {!selectedBadge.isUnlocked && (
                    <View style={styles.modalLockOverlay}>
                      <Ionicons name="lock-closed" size={32} color="#9CA3AF" />
                    </View>
                  )}
                </View>

                {/* 徽章名称 */}
                <Text style={styles.modalTitle}>
                  {selectedBadge.badgeName}
                </Text>

                {/* 分类标签 */}
                <View style={styles.modalTags}>
                  <View style={[styles.modalTag, { backgroundColor: selectedBadge.iconColor + '20' }]}>
                    <Text style={[styles.modalTagText, { color: selectedBadge.iconColor }]}>
                      {getCategoryIcon(selectedBadge.category)} {getCategoryLabel(selectedBadge.category)}
                    </Text>
                  </View>
                  {selectedBadge.isUnlocked && (
                    <View style={[styles.modalTag, { backgroundColor: Colors.success + '20' }]}>
                      <Text style={[styles.modalTagText, { color: Colors.success }]}>
                        ✓ 已解锁
                      </Text>
                    </View>
                  )}
                  {!selectedBadge.isUnlocked && (
                    <View style={[styles.modalTag, { backgroundColor: '#9CA3AF20' }]}>
                      <Text style={[styles.modalTagText, { color: '#6B7280' }]}>
                        🔒 未解锁
                      </Text>
                    </View>
                  )}
                </View>

                {/* 徽章描述 */}
                <Text style={styles.modalDesc}>
                  {selectedBadge.badgeDesc}
                </Text>

                {/* 解锁条件 */}
                <View style={styles.modalInfoCard}>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="trophy-outline" size={18} color={Colors.primary} />
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>解锁条件</Text>
                      <Text style={styles.modalInfoValue}>{getConditionText(selectedBadge)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalDivider} />
                  
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="fitness-outline" size={18} color={Colors.warning} />
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>难度等级</Text>
                      <View style={styles.difficultyBadge}>
                        <View 
                          style={[
                            styles.difficultyDot, 
                            { backgroundColor: getBadgeDifficulty(selectedBadge).color }
                          ]} 
                        />
                        <Text style={[styles.modalInfoValue, { color: getBadgeDifficulty(selectedBadge).color }]}>
                          {getBadgeDifficulty(selectedBadge).level}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 解锁时间 */}
                {selectedBadge.isUnlocked && selectedBadge.unlockedAt && (
                  <View style={styles.modalUnlockInfo}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.success} />
                    <Text style={styles.modalUnlockText}>
                      解锁于 {new Date(selectedBadge.unlockedAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {/* 未解锁提示 */}
                {!selectedBadge.isUnlocked && (
                  <View style={styles.modalLockedHint}>
                    <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                    <Text style={styles.modalLockedHintText}>
                      继续努力，完成目标即可解锁此徽章！
                    </Text>
                  </View>
                )}

                {/* 关闭按钮 */}
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>知道了</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  progressCard: {
    backgroundColor: Colors.card,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  badgeCard: {
    width: (width - 48) / 3,
    margin: 4,
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
  },
  badgeCardLocked: {
    opacity: 0.8,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  badgeEmoji: {
    fontSize: 32,
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: Colors.textMuted,
  },
  badgeCategory: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  modalEmoji: {
    fontSize: 48,
  },
  modalLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  modalBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  modalDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalConditionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  modalDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDateText: {
    fontSize: 13,
    color: Colors.success,
  },
  // 新弹窗样式
  modalTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modalTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalInfoCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalInfoContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalUnlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
  },
  modalUnlockText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: '500',
  },
  modalLockedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  modalLockedHintText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  modalCloseBtn: {
    marginTop: 4,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});

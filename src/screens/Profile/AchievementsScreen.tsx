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
import ScreenHeader from '../../components/ScreenHeader';
import { Theme } from '../../constants/Theme';
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
  const [progress, setProgress] = useState<Record<string, { current: number; target: number }>>({});

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      // 并行获取成就列表和进度
      const [achievementsRes, progressRes] = await Promise.all([
        UserService.getAchievements('all') as any,
        UserService.getAchievementsProgress() as any,
      ]);

      // 获取用户已解锁的成就
      const unlockedBadges = achievementsRes?.data?.achievements || [];
      
      console.log('[徽章] 已解锁:', unlockedBadges.length, unlockedBadges.map((b: any) => b.badgeCode));
      
      // 获取后端返回的所有徽章定义
      let allBadgeDefs: BadgeDefinition[] = achievementsRes?.data?.badgeDefinitions || [];
      
      // 如果后端未返回，根据已解锁的徽章推断定义
      if (allBadgeDefs.length === 0) {
        allBadgeDefs = unlockedBadges.map((ub: any) => ({
          badgeCode: ub.badgeCode,
          badgeName: ub.badgeName,
          badgeDesc: ub.badgeDesc,
          iconEmoji: ub.iconEmoji || '🏆',
          iconColor: ub.iconColor,
          category: ub.category || 'general',
          conditionType: ub.conditionType || 'default',
          conditionValue: ub.conditionValue || 0,
        }));
      }

      // 保存进度数据
      const progressData = progressRes?.data || {};
      setProgress(progressData);

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

  const getBadgeProgress = (badgeCode: string) => {
    return progress[badgeCode] || { current: 0, target: 1 };
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
  const getCategoryIcon = (category: string): React.ComponentProps<typeof Ionicons>['name'] => {
    const icons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
      continuous: 'flame-outline',
      balanced: 'fitness-outline',
      habit: 'star-outline',
      general: 'trophy-outline',
    };
    return icons[category] || 'trophy-outline';
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
      if (conditionValue >= 30) return { level: '困难', color: Theme.colors.danger };
      if (conditionValue >= 7) return { level: '中等', color: Theme.colors.warning };
      return { level: '简单', color: Theme.colors.success };
    }
    if (conditionType === 'record_count' && conditionValue >= 50) {
      return { level: '困难', color: Theme.colors.danger };
    }
    if (conditionValue >= 20) {
      return { level: '中等', color: Theme.colors.warning };
    }
    return { level: '简单', color: Theme.colors.success };
  };

  // 获取进度单位
  const getProgressUnit = (conditionType: string) => {
    switch (conditionType) {
      case 'streak_days':
      case 'balanced_days':
      case 'sugar_control_days':
      case 'calorie_perfect_days':
      case 'water_days':
        return '天';
      case 'record_count':
      case 'photo_count':
      case 'chat_count':
      case 'meal_plan_count':
      case 'veggie_count':
        return '次';
      case 'early_record':
        return '天';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <ScreenHeader title="成就徽章" subtitle="收集徽章，记录健康里程碑" />

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
                <Text style={{ fontSize: 28 }}>{badge.iconEmoji || '🏆'}</Text>
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
                <>
                  <View style={styles.badgeProgressContainer}>
                    <View style={styles.badgeProgressBar}>
                      <View
                        style={[
                          styles.badgeProgressFill,
                          {
                            width: `${Math.min(
                              (getBadgeProgress(badge.badgeCode).current /
                                getBadgeProgress(badge.badgeCode).target) *
                                100,
                              100
                            )}%`,
                            backgroundColor: badge.iconColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.badgeProgressText}>
                      {getBadgeProgress(badge.badgeCode).current}/
                      {getBadgeProgress(badge.badgeCode).target}
                    </Text>
                  </View>
                  <View style={styles.lockedOverlay}>
                    <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                  </View>
                </>
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
                  <Text style={{ fontSize: 48 }}>{selectedBadge.iconEmoji || '🏆'}</Text>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={getCategoryIcon(selectedBadge.category)} size={14} color={selectedBadge.iconColor} style={{ marginRight: 4 }} />
                      <Text style={[styles.modalTagText, { color: selectedBadge.iconColor }]}>
                        {getCategoryLabel(selectedBadge.category)}
                      </Text>
                    </View>
                  </View>
                  {selectedBadge.isUnlocked && (
                    <View style={[styles.modalTag, { backgroundColor: Theme.colors.success + '20' }]}>
                      <Text style={[styles.modalTagText, { color: Theme.colors.success }]}>
                        ✓ 已解锁
                      </Text>
                    </View>
                  )}
                  {!selectedBadge.isUnlocked && (
                    <View style={[styles.modalTag, { backgroundColor: Theme.colors.alpha.text10 }]}>
                      <Text style={[styles.modalTagText, { color: Theme.colors.textSecondary }]}>
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
                    <Ionicons name="trophy-outline" size={18} color={Theme.colors.primary} />
                    <View style={styles.modalInfoContent}>
                      <Text style={styles.modalInfoLabel}>解锁条件</Text>
                      <Text style={styles.modalInfoValue}>{getConditionText(selectedBadge)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalDivider} />
                  
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="fitness-outline" size={18} color={Theme.colors.warning} />
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
                    <Ionicons name="calendar-outline" size={16} color={Theme.colors.success} />
                    <Text style={styles.modalUnlockText}>
                      解锁于 {new Date(selectedBadge.unlockedAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {/* 进度展示 */}
                {!selectedBadge.isUnlocked && (
                  <View style={[styles.modalInfoCard, { marginBottom: 12 }]}>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="trending-up-outline" size={18} color={Theme.colors.primary} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={styles.modalInfoLabel}>当前进度</Text>
                          <Text style={[styles.modalInfoValue, { color: Theme.colors.primary }]}>
                            {getBadgeProgress(selectedBadge.badgeCode).current} / {getBadgeProgress(selectedBadge.badgeCode).target}
                          </Text>
                        </View>
                        <View style={styles.modalProgressBar}>
                          <View
                            style={[
                              styles.modalProgressFill,
                              {
                                width: `${Math.min(
                                  (getBadgeProgress(selectedBadge.badgeCode).current /
                                    getBadgeProgress(selectedBadge.badgeCode).target) *
                                    100,
                                  100
                                )}%`,
                                backgroundColor: selectedBadge.iconColor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* 未解锁提示 */}
                {!selectedBadge.isUnlocked && (
                  <View style={styles.modalLockedHint}>
                    <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                    <Text style={styles.modalLockedHintText}>
                      还差 {Math.max(0, getBadgeProgress(selectedBadge.badgeCode).target - getBadgeProgress(selectedBadge.badgeCode).current)} {getProgressUnit(selectedBadge.conditionType)} 即可解锁！
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
    backgroundColor: Theme.colors.background,
  },
  progressCard: {
    backgroundColor: Theme.colors.card,
    margin: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.compact,
  },
  progressTitle: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  progressCount: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: Theme.radius.xxs,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.xxs,
  },
  progressText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.card,
  },
  filterTabActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterTabText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: 'white',
    fontWeight: Theme.typography.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Theme.spacing.compact,
    paddingBottom: Theme.spacing.xl,
  },
  badgeCard: {
    width: (width - 48) / 3,
    margin: Theme.spacing.xs,
    padding: Theme.spacing.compact,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
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
    marginBottom: Theme.spacing.sm,
    position: 'relative',
  },
  badgeEmoji: {
    fontSize: 32,
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Theme.colors.danger,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.radius.xs,
  },
  newBadgeText: {
    fontSize: Theme.typography.sizes.tiny,
    color: 'white',
    fontWeight: Theme.typography.weights.bold,
  },
  badgeName: {
    fontSize: Theme.typography.sizes.small,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: Theme.colors.textMuted,
  },
  badgeCategory: {
    fontSize: Theme.typography.sizes.tiny,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  badgeProgressContainer: {
    width: '100%',
    marginTop: Theme.spacing.xs,
    alignItems: 'center',
  },
  badgeProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: Theme.typography.sizes.tiny,
    color: Theme.colors.textMuted,
    marginTop: 3,
    fontWeight: Theme.typography.weights.medium,
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
    borderRadius: Theme.radius.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: Theme.colors.card,
    borderRadius: 24,
    padding: Theme.spacing.xl,
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
    marginBottom: Theme.spacing.lg,
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
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  modalBadge: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.lg,
  },
  modalBadgeText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  modalDesc: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.lg,
  },
  modalCondition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  modalConditionText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  modalDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  modalDateText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.success,
  },
  // 新弹窗样式
  modalTags: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.compact,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modalTag: {
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  modalTagText: {
    fontSize: Theme.typography.sizes.small,
    fontWeight: Theme.typography.weights.medium,
  },
  modalInfoCard: {
    width: '100%',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.compact,
  },
  modalInfoContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  modalInfoValue: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.compact,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: Theme.radius.xxs,
  },
  modalUnlockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.success + '10',
    borderRadius: Theme.radius.md,
  },
  modalUnlockText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.success,
    fontWeight: Theme.typography.weights.medium,
  },
  modalLockedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.compact,
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.md,
  },
  modalLockedHintText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  modalCloseBtn: {
    marginTop: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.xxl,
    paddingVertical: Theme.spacing.compact,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: Theme.typography.sizes.h3,
    fontWeight: Theme.typography.weights.semibold,
    color: 'white',
  },
  modalProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: Theme.radius.xxs,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: Theme.radius.xxs,
  },
});

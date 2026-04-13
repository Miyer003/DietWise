import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Theme } from '../../constants/Theme';
import { useAuth } from '../../store/AuthContext';
import { DietService, TipsService, AIService } from '../../services/api';
import { DailySummary, DietRecord, AITip } from '../../types';

const { width } = Dimensions.get('window');

// 环形进度条组件
const CircularProgress: React.FC<{ progress: number; consumed: number; goal: number }> = ({
  progress,
  consumed,
  goal,
}) => {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <View style={styles.progressRingContainer}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Theme.colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progress > 100 ? Theme.colors.danger : Theme.colors.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressValue}>{consumed.toLocaleString()}</Text>
        <Text style={styles.progressLabel}>/ {goal.toLocaleString()} kcal</Text>
        <Text style={[styles.progressPercent, { color: progress > 100 ? Theme.colors.danger : Theme.colors.primary }]}>
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
};

// 营养进度条组件
const NutrientBar: React.FC<{ label: string; current: number; total: number; color: string }> = ({
  label,
  current,
  total,
  color,
}) => {
  const percent = Math.min((current / total) * 100, 100);
  
  return (
    <View style={styles.nutrientContainer}>
      <View style={styles.nutrientHeader}>
        <View style={styles.nutrientLabel}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.nutrientName}>{label}</Text>
        </View>
        <Text style={styles.nutrientValue}>{Math.round(current)}g / {Math.round(total)}g</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// AI建议卡片
const AICard: React.FC<{ 
  tip: AITip | null; 
  onRefresh: () => void;
  onConsult: () => void; 
  onDetail: () => void;
  isLoading: boolean;
}> = ({ tip, onRefresh, onConsult, onDetail, isLoading }) => {
  return (
    <View style={styles.aiCard}>
      <View style={styles.aiCardHeader}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={20} color={Theme.colors.primary} />
        </View>
        <View style={styles.aiTitleContainer}>
          <Text style={styles.aiTitle}>
            {tip?.type === 'user' ? '我的提示' : 'AI 营养建议'}
          </Text>
          <TouchableOpacity onPress={onRefresh} disabled={isLoading}>
            <Text style={[styles.aiTime, isLoading && { opacity: 0.5 }]}>
              {isLoading ? '刷新中...' : '刷新'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.aiContent}>{tip?.content || '正在获取建议...'}</Text>
      <View style={styles.aiActions}>
        <TouchableOpacity style={styles.aiButtonPrimary} onPress={onConsult}>
          <Text style={styles.aiButtonPrimaryText}>咨询 AI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiButtonSecondary} onPress={onDetail}>
          <Text style={styles.aiButtonSecondaryText}>详情</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 时间线项目
const TimelineItem: React.FC<{ 
  record: DietRecord; 
  isLast?: boolean;
  onDelete?: (id: string) => void;
}> = ({ record, isLast, onDelete }) => {
  const getMealIcon = (type: string) => {
    switch(type) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'sunny';
      case 'dinner': return 'moon-outline';
      default: return 'cafe-outline';
    }
  };

  const getMealName = (type: string) => {
    switch(type) {
      case 'breakfast': return '早餐';
      case 'lunch': return '午餐';
      case 'dinner': return '晚餐';
      default: return '加餐';
    }
  };

  const getMealColor = (type: string) => {
    switch(type) {
      case 'breakfast': return '#F59E0B';
      case 'lunch': return '#10B981';
      case 'dinner': return '#6366F1';
      default: return '#8B5CF6';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const getFoodNames = (record: DietRecord) => {
    if (!record.items || record.items.length === 0) return '无记录';
    return record.items.map(item => item.foodName).join('、');
  };

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      {!isLast && <View style={styles.timelineLine} />}
      <View style={styles.timelineContent}>
        <View style={[styles.timelineIcon, { backgroundColor: getMealColor(record.mealType) + '20' }]}>
          <Ionicons name={getMealIcon(record.mealType) as any} size={16} color={getMealColor(record.mealType)} />
        </View>
        <View style={styles.timelineInfo}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineMealType}>{getMealName(record.mealType)}</Text>
            <View style={styles.timelineHeaderRight}>
              <Text style={styles.timelineTime}>{formatTime(record.createdAt)}</Text>
              {onDelete && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => onDelete(record.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={Theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.timelineFood} numberOfLines={1}>{getFoodNames(record)}</Text>
          <Text style={styles.timelineCalories}>{Math.round(record.totalCalories)} kcal</Text>
        </View>
      </View>
    </View>
  );
};

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [dailyData, setDailyData] = useState<DailySummary | null>(null);
  const [aiTip, setAiTip] = useState<AITip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTipLoading, setIsTipLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentHour = new Date().getHours();
  
  const getGreeting = () => {
    if (currentHour < 12) return '早上好';
    if (currentHour < 14) return '中午好';
    if (currentHour < 18) return '下午好';
    return '晚上好';
  };

  const loadDailyData = useCallback(async () => {
    try {
      const response = await DietService.getDailySummary(today);
      if (response.code === 0 && response.data) {
        setDailyData(response.data);
      }
    } catch (error) {
      console.error('加载每日数据失败:', error);
    }
  }, [today]);

  const loadAiTip = useCallback(async () => {
    setIsTipLoading(true);
    try {
      const tipsRes = await Promise.race([
        TipsService.getTips(),
        new Promise<{code: number, data?: any}>((_, reject) => 
          setTimeout(() => reject(new Error('获取提示超时')), 3000)
        )
      ]);
      
      if (tipsRes.code === 0 && tipsRes.data && tipsRes.data.length > 0) {
        const randomTip = tipsRes.data[Math.floor(Math.random() * tipsRes.data.length)];
        setAiTip({
          id: randomTip.id,
          content: randomTip.content,
          type: 'user',
          colorTheme: randomTip.colorTheme,
        });
      } else {
        const aiRes = await Promise.race([
          AIService.generateTip(),
          new Promise<{code: number, data?: any}>((_, reject) => 
            setTimeout(() => reject(new Error('AI建议超时')), 5000)
          )
        ]);
        
        if (aiRes.code === 0 && aiRes.data) {
          setAiTip(aiRes.data);
        } else {
          throw new Error('获取AI建议失败');
        }
      }
    } catch (error) {
      console.error('加载建议失败:', error);
      setAiTip({
        id: 'default',
        content: '保持均衡饮食，多吃蔬菜水果，适量摄入蛋白质和碳水化合物。',
        type: 'ai',
      });
    } finally {
      setIsTipLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([loadDailyData(), loadAiTip()]);
      setIsLoading(false);
    };
    loadAll();
  }, [loadDailyData, loadAiTip]);

  useFocusEffect(
    useCallback(() => {
      loadDailyData();
    }, [loadDailyData])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadDailyData(), loadAiTip()]);
    setIsRefreshing(false);
  }, [loadDailyData, loadAiTip]);

  const handleDeleteRecord = useCallback(async (recordId: string) => {
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('确定要删除这条记录吗？');
      if (confirmed) {
        try {
          const response = await DietService.deleteRecord(recordId);
          if (response.code === 0) {
            await loadDailyData();
          } else {
            alert('删除失败: ' + (response.message || '请重试'));
          }
        } catch (error) {
          alert('删除失败: 网络错误，请重试');
        }
      }
      return;
    }
    
    Alert.alert(
      '确认删除',
      '确定要删除这条记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await DietService.deleteRecord(recordId);
              if (response.code === 0) {
                await loadDailyData();
              } else {
                Alert.alert('删除失败', response.message || '请重试');
              }
            } catch (error) {
              Alert.alert('删除失败', '网络错误，请重试');
            }
          },
        },
      ]
    );
  }, [loadDailyData]);

  const progress = dailyData && dailyData.calorieGoal > 0
    ? (dailyData.calorieConsumed / dailyData.calorieGoal) * 100 
    : 0;

  const proteinGoal = profile?.weightKg ? profile.weightKg * 1.2 : 60;
  const carbsGoal = profile?.dailyCalorieGoal ? (profile.dailyCalorieGoal * 0.5) / 4 : 250;
  const fatGoal = profile?.dailyCalorieGoal ? (profile.dailyCalorieGoal * 0.3) / 9 : 65;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* 顶部问候区 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>
              {format(new Date(), 'M月d日 EEEE', { locale: zhCN })}
            </Text>
            <Text style={styles.greeting}>{getGreeting()}，{user?.nickname || 'User'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => navigation.navigate('Main', { screen: 'ProfileTab' })}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : user?.avatarEmoji ? (
              <Text style={styles.avatarEmoji}>{user.avatarEmoji}</Text>
            ) : (
              <Text style={styles.avatarText}>
                {(user?.nickname || 'U').charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 环形进度图 */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <CircularProgress 
              progress={progress} 
              consumed={dailyData?.calorieConsumed || 0}
              goal={dailyData?.calorieGoal || profile?.dailyCalorieGoal || 2000}
            />
          </View>
        </View>

        {/* 营养进度条 */}
        <View style={styles.nutrientsSection}>
          <NutrientBar 
            label="蛋白质" 
            current={dailyData?.proteinG || 0} 
            total={proteinGoal} 
            color={Theme.colors.primary} 
          />
          <NutrientBar 
            label="碳水化合物" 
            current={dailyData?.carbsG || 0} 
            total={carbsGoal} 
            color={Theme.colors.warning} 
          />
          <NutrientBar 
            label="脂肪" 
            current={dailyData?.fatG || 0} 
            total={fatGoal} 
            color={Theme.colors.danger} 
          />
        </View>

        {/* AI智能建议卡片 */}
        <View style={styles.aiSection}>
          <AICard 
            tip={aiTip}
            onRefresh={loadAiTip}
            onConsult={() => navigation.navigate('Main', { screen: 'ConsultTab' })}
            onDetail={() => navigation.navigate('Main', { screen: 'AnalyticsTab' })}
            isLoading={isTipLoading}
          />
        </View>

        {/* 今日记录时间线 */}
        <View style={styles.timelineSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="time-outline" size={20} color={Theme.colors.text} />
              <Text style={styles.sectionTitle}>今日记录</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'AnalyticsTab' })}>
              <Text style={styles.sectionLink}>查看全部</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            {dailyData?.mealRecords && dailyData.mealRecords.length > 0 ? (
              dailyData.mealRecords.map((record, index) => (
                <TimelineItem 
                  key={record.id} 
                  record={record} 
                  isLast={index === dailyData.mealRecords.length - 1}
                  onDelete={handleDeleteRecord}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={32} color={Theme.colors.textMuted} />
                <Text style={styles.emptyStateText}>今天还没有记录</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.addRecordItem}
              onPress={() => navigation.navigate('RecordTab')}
            >
              <View style={styles.addRecordIcon}>
                <Ionicons name="add" size={20} color={Theme.colors.primary} />
              </View>
              <Text style={styles.addRecordText}>添加记录</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.page,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  dateText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.xs,
  },
  greeting: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.light,
    letterSpacing: 2,
    color: Theme.colors.text,
  },
  avatarButton: {
    width: 40,
    height: 40,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.textInverse,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius.xs,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  progressSection: {
    paddingVertical: Theme.spacing.section,
    paddingHorizontal: Theme.spacing.page,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.section,
    backgroundColor: Theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  progressRingContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 32,
    fontWeight: Theme.typography.weights.light,
    color: Theme.colors.text,
  },
  progressLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  progressPercent: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.medium,
    marginTop: Theme.spacing.xs,
  },
  nutrientsSection: {
    paddingVertical: Theme.spacing.section,
    paddingHorizontal: Theme.spacing.page,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  nutrientContainer: {
    marginBottom: Theme.spacing.compact,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  nutrientLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Theme.radius.none,
    marginRight: Theme.spacing.sm,
  },
  nutrientName: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  nutrientValue: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: Theme.colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  sectionPadding: {
    paddingHorizontal: Theme.spacing.page,
  },
  aiSection: {
    paddingVertical: Theme.spacing.section,
    paddingHorizontal: Theme.spacing.page,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  aiCard: {
    
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.card,
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  aiCardHeader: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.compact,
    alignItems: 'center',
  },
  aiIcon: {
    width: 36,
    height: 36,
    backgroundColor: Theme.colors.subtle,
    borderRadius: Theme.radius.none,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.compact,
  },
  aiTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: Theme.typography.sizes.h3,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text,
  },
  aiTime: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  aiContent: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.compact,
  },
  aiActions: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  aiButtonPrimary: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.compact,
    borderRadius: Theme.radius.none,
    alignItems: 'center',
  },
  aiButtonPrimaryText: {
    color: Theme.colors.textInverse,
    fontWeight: Theme.typography.weights.medium,
    fontSize: Theme.typography.sizes.body,
  },
  aiButtonSecondary: {
    paddingHorizontal: Theme.spacing.page,
    paddingVertical: Theme.spacing.compact,
    backgroundColor: Theme.colors.subtle,
    borderRadius: Theme.radius.none,
  },
  aiButtonSecondaryText: {
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
    fontSize: Theme.typography.sizes.body,
  },
  timelineSection: {
    paddingVertical: Theme.spacing.section,
    paddingHorizontal: Theme.spacing.page,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.compact,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.light,
    letterSpacing: 1,
    color: Theme.colors.text,
  },
  sectionLink: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  timelineCard: {
    
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    padding: Theme.spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: Theme.spacing.compact,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: Theme.radius.none,
    backgroundColor: Theme.colors.primary,
    marginRight: Theme.spacing.compact,
    marginTop: Theme.spacing.sm,
  },
  timelineLine: {
    display: 'none',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: Theme.radius.none,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.compact,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  timelineMealType: {
    fontSize: Theme.typography.sizes.h3,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text,
  },
  timelineHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  timelineTime: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
  },
  deleteButton: {
    padding: Theme.spacing.xs,
  },
  timelineFood: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  timelineCalories: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl,
  },
  emptyStateText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.sm,
  },
  addRecordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Theme.spacing.compact,
    marginTop: Theme.spacing.compact,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  addRecordIcon: {
    width: 32,
    height: 32,
    borderRadius: Theme.radius.none,
    backgroundColor: Theme.colors.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.compact,
  },
  addRecordText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
});

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
import Colors from '../../constants/Colors';
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
          stroke={Colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progress > 100 ? Colors.danger : Colors.primary}
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
        <Text style={[styles.progressPercent, { color: progress > 100 ? Colors.danger : Colors.primary }]}>
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
          <Ionicons name="sparkles" size={20} color={Colors.primary} />
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
                  <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
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
        <View style={styles.progressContainer}>
          <CircularProgress 
            progress={progress} 
            consumed={dailyData?.calorieConsumed || 0}
            goal={dailyData?.calorieGoal || profile?.dailyCalorieGoal || 2000}
          />
        </View>

        {/* 营养进度条 */}
        <View style={styles.nutrientsContainer}>
          <NutrientBar 
            label="蛋白质" 
            current={dailyData?.proteinG || 0} 
            total={proteinGoal} 
            color={Colors.primary} 
          />
          <NutrientBar 
            label="碳水化合物" 
            current={dailyData?.carbsG || 0} 
            total={carbsGoal} 
            color={Colors.warning} 
          />
          <NutrientBar 
            label="脂肪" 
            current={dailyData?.fatG || 0} 
            total={fatGoal} 
            color="#F97316" 
          />
        </View>

        {/* AI智能建议卡片 */}
        <View style={styles.sectionPadding}>
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
              <Ionicons name="time-outline" size={20} color={Colors.text} />
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
                <Ionicons name="restaurant-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyStateText}>今天还没有记录</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.addRecordItem}
              onPress={() => navigation.navigate('RecordTab')}
            >
              <View style={styles.addRecordIcon}>
                <Ionicons name="add" size={20} color={Colors.primary} />
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
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
  },
  avatarButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: Colors.highlight,
    marginHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  nutrientsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  nutrientContainer: {
    marginBottom: 14,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutrientLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  nutrientName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  nutrientValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionPadding: {
    paddingHorizontal: 16,
  },
  aiCard: {
    backgroundColor: Colors.highlight,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  aiCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  aiIcon: {
    width: 36,
    height: 36,
    backgroundColor: Colors.cream,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  aiTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  aiContent: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  aiActions: {
    flexDirection: 'row',
    gap: 10,
  },
  aiButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiButtonPrimaryText: {
    color: Colors.textInverse,
    fontWeight: '600',
    fontSize: 14,
  },
  aiButtonSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.cream,
    borderRadius: 10,
  },
  aiButtonSecondaryText: {
    color: Colors.text,
    fontWeight: '500',
    fontSize: 14,
  },
  timelineSection: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  timelineCard: {
    backgroundColor: Colors.cream,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 12,
    marginTop: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 3,
    top: 20,
    width: 2,
    height: '100%',
    backgroundColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineMealType: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  timelineHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTime: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  deleteButton: {
    padding: 4,
  },
  timelineFood: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  timelineCalories: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
  addRecordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addRecordIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addRecordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});

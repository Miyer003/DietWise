import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
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
          stroke="#E5E7EB"
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
        <Text style={styles.nutrientValue}>{current}g / {total}g</Text>
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
          <Text style={styles.aiIconText}>🤖</Text>
        </View>
        <View style={styles.aiTitleContainer}>
          <Text style={styles.aiTitle}>
            {tip?.type === 'user' ? '我的提示' : 'AI营养顾问建议'}
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
          <Text style={styles.aiButtonPrimaryText}>咨询AI →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiButtonSecondary} onPress={onDetail}>
          <Text style={styles.aiButtonSecondaryText}>详情</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 时间线项目
const TimelineItem: React.FC<{ record: DietRecord; isLast?: boolean }> = ({ record, isLast }) => {
  const getMealIcon = (type: string) => {
    switch(type) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🍱';
      case 'dinner': return '🌙';
      default: return '🍽️';
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

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  const getFoodNames = (record: DietRecord) => {
    if (!record.items || record.items.length === 0) return '无记录';
    return record.items.map(item => item.food_name).join(' + ');
  };

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      {!isLast && <View style={styles.timelineLine} />}
      <View style={styles.timelineContent}>
        <View style={styles.timelineIcon}>
          <Text style={styles.timelineIconText}>{getMealIcon(record.meal_type)}</Text>
        </View>
        <View style={styles.timelineInfo}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineMealType}>{getMealName(record.meal_type)}</Text>
            <Text style={styles.timelineTime}>{formatTime(record.created_at)}</Text>
          </View>
          <Text style={styles.timelineFood} numberOfLines={1}>{getFoodNames(record)}</Text>
          <Text style={styles.timelineCalories}>{Math.round(record.total_calories)} kcal</Text>
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

  // 加载每日数据
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

  // 加载AI建议
  const loadAiTip = useCallback(async () => {
    setIsTipLoading(true);
    try {
      // 先尝试获取用户自定义提示
      const tipsRes = await TipsService.getTips();
      if (tipsRes.code === 0 && tipsRes.data && tipsRes.data.length > 0) {
        // 随机选择一个用户提示
        const randomTip = tipsRes.data[Math.floor(Math.random() * tipsRes.data.length)];
        setAiTip({
          id: randomTip.id,
          content: randomTip.content,
          type: 'user',
          color_theme: randomTip.color_theme,
        });
      } else {
        // 没有用户提示，获取AI生成的建议
        const aiRes = await AIService.generateTip();
        if (aiRes.code === 0 && aiRes.data) {
          setAiTip(aiRes.data);
        }
      }
    } catch (error) {
      console.error('加载建议失败:', error);
      setAiTip({
        id: 'default',
        content: '根据您近期的饮食数据，建议保持均衡饮食，多吃蔬菜水果。',
        type: 'ai',
      });
    } finally {
      setIsTipLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([loadDailyData(), loadAiTip()]);
      setIsLoading(false);
    };
    loadAll();
  }, [loadDailyData, loadAiTip]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadDailyData(), loadAiTip()]);
    setIsRefreshing(false);
  }, [loadDailyData, loadAiTip]);

  const progress = dailyData && dailyData.calorie_goal > 0
    ? (dailyData.calorie_consumed / dailyData.calorie_goal) * 100 
    : 0;

  // 计算营养素目标（简化计算，实际应该从profile获取）
  const proteinGoal = profile?.weight_kg ? profile.weight_kg * 1.2 : 60;
  const carbsGoal = profile?.daily_calorie_goal ? (profile.daily_calorie_goal * 0.5) / 4 : 250;
  const fatGoal = profile?.daily_calorie_goal ? (profile.daily_calorie_goal * 0.3) / 9 : 65;

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
            <Text style={styles.greeting}>早上好，{user?.nickname || 'User'} 👋</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.avatarEmoji}>{user?.avatar_emoji || '😊'}</Text>
          </TouchableOpacity>
        </View>

        {/* 环形进度图 */}
        <View style={styles.progressContainer}>
          <CircularProgress 
            progress={progress} 
            consumed={dailyData?.calorie_consumed || 0}
            goal={dailyData?.calorie_goal || profile?.daily_calorie_goal || 2000}
          />
        </View>

        {/* 营养进度条 */}
        <View style={styles.nutrientsContainer}>
          <NutrientBar 
            label="蛋白质" 
            current={dailyData?.protein_g || 0} 
            total={proteinGoal} 
            color={Colors.primary} 
          />
          <NutrientBar 
            label="碳水" 
            current={dailyData?.carbs_g || 0} 
            total={carbsGoal} 
            color={Colors.warning} 
          />
          <NutrientBar 
            label="脂肪" 
            current={dailyData?.fat_g || 0} 
            total={fatGoal} 
            color="#F97316" 
          />
        </View>

        {/* AI智能建议卡片 */}
        <View style={styles.sectionPadding}>
          <AICard 
            tip={aiTip}
            onRefresh={loadAiTip}
            onConsult={() => navigation.navigate('ConsultTab')}
            onDetail={() => navigation.navigate('AnalyticsTab')}
            isLoading={isTipLoading}
          />
        </View>

        {/* 今日记录时间线 */}
        <View style={styles.timelineSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 今日记录</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AnalyticsTab')}>
              <Text style={styles.sectionLink}>查看全部 →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            {dailyData?.meal_records && dailyData.meal_records.length > 0 ? (
              dailyData.meal_records.map((record, index) => (
                <TimelineItem 
                  key={record.id} 
                  record={record} 
                  isLast={index === dailyData.meal_records.length - 1}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>今天还没有记录哦</Text>
              </View>
            )}
            
            {/* 添加记录入口 */}
            <TouchableOpacity 
              style={styles.addRecordItem}
              onPress={() => navigation.navigate('RecordTab')}
            >
              <View style={styles.addRecordIcon}>
                <Text style={styles.addRecordPlus}>+</Text>
              </View>
              <Text style={styles.addRecordText}>点击添加记录...</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部留白 */}
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
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  avatarButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
    fontWeight: 'bold',
    color: Colors.text,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  nutrientsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nutrientContainer: {
    marginBottom: 12,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  nutrientName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionPadding: {
    paddingHorizontal: 16,
  },
  aiCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  aiCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  aiIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiIconText: {
    fontSize: 20,
  },
  aiTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  aiTitle: {
    fontSize: 16,
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
    marginBottom: 12,
  },
  aiActions: {
    flexDirection: 'row',
    gap: 12,
  },
  aiButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  aiButtonPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
  aiButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  aiButtonSecondaryText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  timelineSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timelineCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    marginRight: -4,
    marginTop: 12,
    zIndex: 1,
    borderWidth: 2,
    borderColor: 'white',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 20,
    bottom: -16,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    marginLeft: 0,
  },
  timelineIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIconText: {
    fontSize: 24,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineMealType: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timelineTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  timelineFood: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timelineCalories: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
  },
  addRecordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    marginLeft: 0,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  addRecordIcon: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addRecordPlus: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: '300',
  },
  addRecordText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});

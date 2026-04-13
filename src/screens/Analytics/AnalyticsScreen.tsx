import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { zhCN } from 'date-fns/locale';
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';
import { DietService } from '../../services/api';
import { DailySummary, WeeklySummary, MonthlySummary, DietRecord } from '../../types';
import HistoryView from './HistoryView';

const { width } = Dimensions.get('window');

// 分段控制器组件
const SegmentControl: React.FC<{
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
}> = ({ options, selected, onSelect }) => {
  return (
    <View style={styles.segmentContainer}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segmentItem,
            selected === index && styles.segmentItemActive
          ]}
          onPress={() => onSelect(index)}
        >
          <Text style={[
            styles.segmentText,
            selected === index && styles.segmentTextActive
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// 统计卡片
const StatCard: React.FC<{ value: string; label: string; subtext?: string; color?: string }> = ({
  value,
  label,
  subtext,
  color = Theme.colors.text,
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
  </View>
);

// 营养条
const NutrientBar: React.FC<{ label: string; current: number; total: number; color: string; source?: string }> = ({
  label,
  current,
  total,
  color,
  source,
}) => {
  const percent = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isLow = percent < 50;
  
  return (
    <View style={styles.nutrientRow}>
      <View style={styles.nutrientHeader}>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <Text style={[styles.nutrientValue, isLow && { color: Theme.colors.danger }]}>
          {Math.round(current)}g / {Math.round(total)}g
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      {source && <Text style={styles.nutrientSource}>主要来源：{source}</Text>}
    </View>
  );
};

export default function AnalyticsScreen({ navigation, route }: any) {
  // 标签页状态：0=今日, 1=本周, 2=本月, 3=历史
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 0);
  const tabs = ['今日', '本周', '本月', '历史'];
  
  // 当前显示的具体日期/周/月
  const [displayDate, setDisplayDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [displayWeek, setDisplayWeek] = useState<string>(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [displayMonth, setDisplayMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  // 数据状态
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [todayRecords, setTodayRecords] = useState<DietRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载指定日期的数据
  const loadDailyData = useCallback(async (date: string) => {
    console.log('[Analytics] 加载日期数据:', date);
    try {
      const [summaryRes, recordsRes] = await Promise.all([
        DietService.getDailySummary(date),
        DietService.getRecords({ date }),
      ]);
      
      if (summaryRes.code === 0 && summaryRes.data) {
        setDailySummary(summaryRes.data);
        setDisplayDate(date);  // 更新当前显示的日期
      }
      
      if (recordsRes.code === 0 && recordsRes.data) {
        setTodayRecords(recordsRes.data.records || []);
      }
    } catch (error) {
      console.error('加载每日数据失败:', error);
    }
  }, []);

  // 加载指定周的数据
  const loadWeeklyData = useCallback(async (weekStart: string) => {
    console.log('[Analytics] 加载周数据:', weekStart);
    try {
      const res = await DietService.getWeeklySummary(weekStart);
      if (res.code === 0 && res.data) {
        setWeeklySummary(res.data);
        setDisplayWeek(weekStart);  // 更新当前显示的周
      }
    } catch (error) {
      console.error('加载周数据失败:', error);
    }
  }, []);

  // 加载指定月的数据
  const loadMonthlyData = useCallback(async (month: string) => {
    console.log('[Analytics] 加载月数据:', month);
    try {
      const res = await DietService.getMonthlySummary(month);
      if (res.code === 0 && res.data) {
        setMonthlySummary(res.data);
        setDisplayMonth(month);  // 更新当前显示的月
      }
    } catch (error) {
      console.error('加载月数据失败:', error);
    }
  }, []);

  // 加载当前标签的数据
  const loadCurrentTabData = useCallback(async () => {
    if (activeTab === 3) return; // 历史标签不加载
    
    setIsLoading(true);
    switch (activeTab) {
      case 0:
        await loadDailyData(displayDate);
        break;
      case 1:
        await loadWeeklyData(displayWeek);
        break;
      case 2:
        await loadMonthlyData(displayMonth);
        break;
    }
    setIsLoading(false);
  }, [activeTab, displayDate, displayWeek, displayMonth, loadDailyData, loadWeeklyData, loadMonthlyData]);

  // 初始加载和标签切换时加载数据
  useEffect(() => {
    loadCurrentTabData();
  }, [activeTab]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCurrentTabData();
    setIsRefreshing(false);
  }, [loadCurrentTabData]);

  // 从历史记录跳转
  const handleNavigateFromHistory = useCallback((tabIndex: number, params?: any) => {
    console.log('[Analytics] 历史记录跳转:', tabIndex, params);
    
    if (tabIndex === 0 && params?.date) {
      setDisplayDate(params.date);
    } else if (tabIndex === 1 && params?.weekStart) {
      setDisplayWeek(params.weekStart);
    } else if (tabIndex === 2 && params?.month) {
      setDisplayMonth(params.month);
    }
    
    // 切换到对应标签，useEffect 会自动加载数据
    setActiveTab(tabIndex);
  }, []);

  // 删除记录
  const handleDeleteRecord = useCallback(async (recordId: string) => {
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
                // 重新加载当前日期的数据
                await loadDailyData(displayDate);
              } else {
                Alert.alert('删除失败', response.message || '请重试');
              }
            } catch (error) {
              console.error('删除记录失败:', error);
              Alert.alert('删除失败', '网络错误，请重试');
            }
          },
        },
      ]
    );
  }, [displayDate, loadDailyData]);

  // 渲染内容
  const renderContent = () => {
    if (isLoading && activeTab !== 3) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      );
    }

    switch(activeTab) {
      case 0:
        return (
          <TodayView 
            navigation={navigation} 
            summary={dailySummary}
            records={todayRecords}
            displayDate={displayDate}
            onDelete={handleDeleteRecord}
          />
        );
      case 1:
        return <WeekView summary={weeklySummary} displayWeek={displayWeek} />;
      case 2:
        return <MonthView summary={monthlySummary} displayMonth={displayMonth} />;
      case 3:
        return <HistoryView navigation={navigation} onNavigateToTab={handleNavigateFromHistory} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <ScreenHeader
          title="饮食分析"
          subtitle={`${
            activeTab === 0 ? `${displayDate} 数据` :
            activeTab === 1 ? `${displayWeek} 当周数据` :
            activeTab === 2 ? `${displayMonth} 当月数据` :
            '历史记录'
          }`}
          rightIcon="bar-chart"
        />

        {/* 分段控制器 */}
        <View style={styles.segmentWrapper}>
          <SegmentControl 
            options={tabs} 
            selected={activeTab} 
            onSelect={setActiveTab} 
          />
        </View>

        {/* 动态内容 */}
        {renderContent()}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 今日视图组件
const TodayView: React.FC<{ 
  navigation: any; 
  summary: DailySummary | null;
  records: DietRecord[];
  displayDate: string;
  onDelete?: (id: string) => void;
}> = ({ navigation, summary, records, displayDate, onDelete }) => {
  const calorieGoal = summary?.calorieGoal || 2000;
  const calorieConsumed = summary?.calorieConsumed || 0;
  const calorieRemaining = Math.max(0, calorieGoal - calorieConsumed);
  const healthScore = summary?.healthScore || 0;
  
  const proteinGoal = calorieGoal * 0.2 / 4;
  const carbsGoal = calorieGoal * 0.5 / 4;
  const fatGoal = calorieGoal * 0.3 / 9;
  const fiberGoal = 25;

  const isToday = displayDate === format(new Date(), 'yyyy-MM-dd');
  const dateLabel = isToday ? '今日' : displayDate;

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

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '--:--';
    }
  };

  return (
    <>
      {/* 如果不是今天，显示日期提示 */}
      {!isToday && (
        <View style={styles.dateBanner}>
          <Text style={styles.dateBannerText}>查看历史数据：{displayDate}</Text>
        </View>
      )}

      {/* 概览卡片 */}
      <View style={styles.statsGrid}>
        <StatCard 
          value={calorieConsumed.toLocaleString()} 
          label={`${dateLabel}摄入`} 
          subtext={`剩余 ${Math.round(calorieRemaining)}`} 
          color={calorieConsumed > calorieGoal ? Theme.colors.danger : Theme.colors.text} 
        />
        <StatCard 
          value={records.length.toString()} 
          label="已记录餐次" 
          subtext="目标 3餐" 
          color={Theme.colors.text} 
        />
        <StatCard 
          value={healthScore.toString()} 
          label="健康评分" 
          subtext={healthScore >= 80 ? '优秀' : healthScore >= 60 ? '良好' : '需改善'} 
          color={healthScore >= 80 ? Theme.colors.success : healthScore >= 60 ? Theme.colors.warning : Theme.colors.danger} 
        />
      </View>

      {/* 营养成分分析 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🥜 营养成分分析</Text>
        <View style={styles.nutrientsList}>
          <NutrientBar label="蛋白质" current={summary?.proteinG || 0} total={proteinGoal} color={Theme.colors.primary} />
          <NutrientBar label="碳水化合物" current={summary?.carbsG || 0} total={carbsGoal} color={Theme.colors.warning} />
          <NutrientBar label="脂肪" current={summary?.fatG || 0} total={fatGoal} color="#F97316" />
          <NutrientBar label="膳食纤维" current={summary?.fiberG || 0} total={fiberGoal} color={Theme.colors.danger} />
        </View>
      </View>

      {/* 餐次记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{dateLabel}餐次记录</Text>
        
        {records.length > 0 ? (
          records.map((record, index) => (
            <View key={record.id || index} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={[styles.mealIcon, { backgroundColor: index % 2 === 0 ? '#FFEDD5' : '#FEE2E2' }]}>
                  <Ionicons name={getMealIcon(record.mealType)} size={24} color={index % 2 === 0 ? '#EA580C' : '#DC2626'} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{getMealName(record.mealType)} {formatTime(record.createdAt)}</Text>
                  <Text style={styles.mealFood}>
                    {record.items?.map(i => i.foodName).join(' + ') || '无食物记录'}
                  </Text>
                </View>
                <View style={styles.mealCalories}>
                  <Text style={[styles.calorieValue, record.totalCalories > 800 && { color: Theme.colors.danger }]}>
                    {Math.round(record.totalCalories)}
                  </Text>
                  <Text style={styles.calorieUnit}>kcal</Text>
                </View>
                {onDelete && (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(record.id)}>
                    <Ionicons name="trash-outline" size={20} color={Theme.colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{dateLabel}还没有记录哦</Text>
          </View>
        )}
      </View>
    </>
  );
};

// 本周视图组件
const WeekView: React.FC<{ summary: WeeklySummary | null; displayWeek: string }> = ({ summary, displayWeek }) => {
  const avgCalories = summary?.avgDailyCalories || 0;
  const healthScore = summary?.healthScore || 0;
  const compliantDays = summary?.compliantDays || 0;
  
  return (
    <>
      <View style={styles.dateBanner}>
        <Text style={styles.dateBannerText}>周开始：{displayWeek}</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <StatCard value={Math.round(avgCalories).toString()} label="平均日摄入" subtext="kcal" color={Theme.colors.text} />
        <StatCard value={healthScore.toString()} label="周健康评分" subtext={healthScore >= 80 ? '良好' : '需改善'} color={healthScore >= 80 ? Theme.colors.success : Theme.colors.warning} />
        <StatCard value={`${compliantDays}/7`} label="合规天数" subtext="达标天数" color={compliantDays >= 5 ? Theme.colors.success : Theme.colors.warning} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>每日热量趋势</Text>
        {summary?.dailyTrends?.map((day, index) => (
          <View key={index} style={styles.trendItem}>
            <Text style={styles.trendDate}>{day.date}</Text>
            <Text style={[styles.trendCalories, day.isCompliant ? styles.compliant : styles.notCompliant]}>
              {Math.round(day.calories)} kcal
            </Text>
          </View>
        ))}
      </View>
    </>
  );
};

// 本月视图组件
const MonthView: React.FC<{ summary: MonthlySummary | null; displayMonth: string }> = ({ summary, displayMonth }) => {
  const avgCalories = summary?.avgDailyCalories || 0;
  const healthScore = summary?.healthScore || 0;
  
  return (
    <>
      <View style={styles.dateBanner}>
        <Text style={styles.dateBannerText}>月份：{displayMonth}</Text>
      </View>
      
      <View style={styles.statsGrid}>
        <StatCard value={Math.round(avgCalories).toString()} label="平均日摄入" subtext="kcal" color={Theme.colors.text} />
        <StatCard value={healthScore.toString()} label="月健康评分" subtext={healthScore >= 80 ? '良好' : '需改善'} color={healthScore >= 80 ? Theme.colors.success : Theme.colors.warning} />
        <StatCard value={`${summary?.compliantDays || 0}`} label="合规天数" subtext="达标天数" color={Theme.colors.text} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>每周趋势</Text>
        {summary?.weeklyTrends?.map((week, index) => (
          <View key={index} style={styles.trendItem}>
            <Text style={styles.trendDate}>第{week.week}周</Text>
            <Text style={styles.trendCalories}>{week.avgCalories} kcal/天</Text>
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  segmentWrapper: {
    padding: Theme.spacing.lg,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.xs,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.radius.xs,
  },
  segmentItemActive: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  segmentText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: Theme.colors.primary,
  },
  dateBanner: {
    backgroundColor: Theme.colors.primaryLight,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderRadius: Theme.radius.xs,
    alignItems: 'center',
  },
  dateBannerText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.highlight,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  statValue: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.bold,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Theme.colors.cream,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  cardTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.lg,
  },
  nutrientsList: {
    gap: Theme.spacing.lg,
  },
  nutrientRow: {
    marginBottom: Theme.spacing.xs,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  nutrientLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  nutrientValue: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: Theme.colors.border,
    borderRadius: Theme.radius.xxs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Theme.radius.xxs,
  },
  nutrientSource: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  section: {
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  mealCard: {
    backgroundColor: Theme.colors.cream,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    width: 48,
    height: 48,
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  mealFood: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  calorieUnit: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  deleteButton: {
    padding: Theme.spacing.sm,
    marginLeft: Theme.spacing.sm,
  },
  deleteButtonText: {
    fontSize: Theme.typography.sizes.h2,
  },
  emptyCard: {
    backgroundColor: Theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  trendDate: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  trendCalories: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  compliant: {
    color: Theme.colors.success,
  },
  notCompliant: {
    color: Theme.colors.danger,
  },
});

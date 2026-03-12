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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns/format';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';
import { getWeek } from 'date-fns/getWeek';
import { getMonth } from 'date-fns/getMonth';
import { getYear } from 'date-fns/getYear';
import { zhCN } from 'date-fns/locale';
import Colors from '../../constants/Colors';
import { DietService } from '../../services/api';
import { DailySummary, WeeklySummary, MonthlySummary, DietRecord } from '../../types';

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
  color = Colors.text,
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
  </View>
);

// 营养条（今日视图用）
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
        <Text style={[styles.nutrientValue, isLow && { color: Colors.danger }]}>
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

// 雷达图组件（本周/本月用）
const RadarChart: React.FC<{ score: number }> = ({ score }) => {
  return (
    <View style={styles.radarContainer}>
      <Svg width={200} height={200} viewBox="0 0 200 200">
        <Polygon
          points="100,20 180,60 180,140 100,180 20,140 20,60"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        <Polygon
          points="100,40 160,70 160,130 100,160 40,130 40,70"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        <Polygon
          points="100,60 140,80 140,120 100,140 60,120 60,80"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
        <Polygon
          points="100,45 155,75 165,130 100,155 40,130 35,75"
          fill="rgba(16, 185, 129, 0.2)"
          stroke={Colors.primary}
          strokeWidth="2"
        />
        <SvgText x="100" y="15" textAnchor="middle" fill="#6B7280" fontSize="10">蛋白质</SvgText>
        <SvgText x="190" y="55" textAnchor="middle" fill="#6B7280" fontSize="10">碳水</SvgText>
        <SvgText x="190" y="145" textAnchor="middle" fill="#6B7280" fontSize="10">脂肪</SvgText>
        <SvgText x="100" y="195" textAnchor="middle" fill="#6B7280" fontSize="10">维生素</SvgText>
        <SvgText x="10" y="145" textAnchor="middle" fill="#6B7280" fontSize="10">纤维</SvgText>
        <SvgText x="10" y="55" textAnchor="middle" fill="#6B7280" fontSize="10">矿物质</SvgText>
      </Svg>
      <View style={styles.radarScore}>
        <Text style={styles.radarScoreValue}>{score}</Text>
        <Text style={styles.radarScoreLabel}>评分</Text>
      </View>
    </View>
  );
};

// 柱状图
const BarChart: React.FC<{ data: number[]; labels: string[]; color?: string }> = ({ data, labels, color = Colors.primary }) => {
  const max = Math.max(...data, 1);
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.barsContainer}>
        {data.map((value, index) => (
          <TouchableOpacity key={index} style={styles.barColumn}>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: `${(value / max) * 100}%`,
                    backgroundColor: index === data.length - 1 ? color : '#E5E7EB'
                  }
                ]} 
              />
              <Text style={styles.barValue}>{Math.round(value)}</Text>
            </View>
            <Text style={styles.barLabel}>{labels[index]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// 引入 SVG 组件
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';

export default function AnalyticsScreen({ navigation, route }: any) {
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 0); // 0:今日, 1:本周, 2:本月, 3:历史
  const tabs = ['今日', '本周', '本月', '历史'];
  
  // 数据状态
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [todayRecords, setTodayRecords] = useState<DietRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载今日数据
  const loadDailyData = useCallback(async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [summaryRes, recordsRes] = await Promise.all([
        DietService.getDailySummary(today),
        DietService.getRecords({ date: today }),
      ]);
      
      if (summaryRes.code === 0 && summaryRes.data) {
        setDailySummary(summaryRes.data);
      }
      
      if (recordsRes.code === 0 && recordsRes.data) {
        setTodayRecords(recordsRes.data.records || []);
      }
    } catch (error) {
      console.error('加载今日数据失败:', error);
    }
  }, []);

  // 加载本周数据
  const loadWeeklyData = useCallback(async () => {
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const res = await DietService.getWeeklySummary(weekStart);
      if (res.code === 0 && res.data) {
        setWeeklySummary(res.data);
      }
    } catch (error) {
      console.error('加载本周数据失败:', error);
    }
  }, []);

  // 加载本月数据
  const loadMonthlyData = useCallback(async () => {
    try {
      const month = format(new Date(), 'yyyy-MM');
      const res = await DietService.getMonthlySummary(month);
      if (res.code === 0 && res.data) {
        setMonthlySummary(res.data);
      }
    } catch (error) {
      console.error('加载本月数据失败:', error);
    }
  }, []);

  // 根据选中标签加载数据
  const loadDataByTab = useCallback(async (tabIndex: number) => {
    setIsLoading(true);
    switch (tabIndex) {
      case 0:
        await loadDailyData();
        break;
      case 1:
        await loadWeeklyData();
        break;
      case 2:
        await loadMonthlyData();
        break;
    }
    setIsLoading(false);
  }, [loadDailyData, loadWeeklyData, loadMonthlyData]);

  // 初始加载
  useEffect(() => {
    loadDataByTab(activeTab);
  }, [activeTab, loadDataByTab]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDataByTab(activeTab);
    setIsRefreshing(false);
  }, [activeTab, loadDataByTab]);

  // 根据选中标签渲染不同内容
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    switch(activeTab) {
      case 0: // 今日视图
        return (
          <TodayView 
            navigation={navigation} 
            summary={dailySummary}
            records={todayRecords}
          />
        );
      case 1: // 本周视图
        return <WeekView summary={weeklySummary} />;
      case 2: // 本月视图
        return <MonthView summary={monthlySummary} />;
      case 3: // 历史视图
        return <HistoryView />;
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
        {/* 顶部标题 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>饮食分析</Text>
            <Text style={styles.headerSubtitle}>{tabs[activeTab]}数据详情</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 24 }}>📊</Text>
          </View>
        </View>

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
}> = ({ navigation, summary, records }) => {
  const calorieGoal = summary?.calorieGoal || 2000;
  const calorieConsumed = summary?.calorieConsumed || 0;
  const calorieRemaining = Math.max(0, calorieGoal - calorieConsumed);
  const healthScore = summary?.healthScore || 0;
  
  // 计算营养素目标和实际摄入
  const proteinGoal = calorieGoal * 0.2 / 4; // 蛋白质占20%热量
  const carbsGoal = calorieGoal * 0.5 / 4;   // 碳水占50%热量
  const fatGoal = calorieGoal * 0.3 / 9;     // 脂肪占30%热量
  const fiberGoal = 25;
  const vitaminCGoal = 100;

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

  // 获取主要营养来源
  const getMainSource = (nutrient: 'protein' | 'carbs' | 'fat') => {
    if (records.length === 0) return undefined;
    
    const sources = records.flatMap(r => r.items || []);
    if (sources.length === 0) return undefined;
    
    // 按营养素排序找主要来源
    const sorted = [...sources].sort((a, b) => {
      if (nutrient === 'protein') return b.proteinG - a.proteinG;
      if (nutrient === 'carbs') return b.carbsG - a.carbsG;
      return b.fatG - a.fatG;
    });
    
    return sorted.slice(0, 2).map(s => s.foodName).join('、');
  };

  return (
    <>
      {/* 概览卡片 */}
      <View style={styles.statsGrid}>
        <StatCard 
          value={calorieConsumed.toLocaleString()} 
          label="今日摄入" 
          subtext={`剩余 ${Math.round(calorieRemaining)}`} 
          color={calorieConsumed > calorieGoal ? Colors.danger : Colors.text} 
        />
        <StatCard 
          value={records.length.toString()} 
          label="已记录餐次" 
          subtext="目标 3餐" 
          color={Colors.text} 
        />
        <StatCard 
          value={healthScore.toString()} 
          label="健康评分" 
          subtext={healthScore >= 80 ? '优秀' : healthScore >= 60 ? '良好' : '需改善'} 
          color={healthScore >= 80 ? Colors.success : healthScore >= 60 ? Colors.warning : Colors.danger} 
        />
      </View>

      {/* 营养成分分析 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🥜 营养成分分析</Text>
        <View style={styles.nutrientsList}>
          <NutrientBar 
            label="蛋白质" 
            current={summary?.proteinG || 0} 
            total={proteinGoal} 
            color={Colors.primary} 
            source={getMainSource('protein')}
          />
          <NutrientBar 
            label="碳水化合物" 
            current={summary?.carbsG || 0} 
            total={carbsGoal} 
            color={Colors.warning} 
            source={getMainSource('carbs')}
          />
          <NutrientBar 
            label="脂肪" 
            current={summary?.fatG || 0} 
            total={fatGoal} 
            color="#F97316" 
            source={getMainSource('fat')}
          />
          <NutrientBar 
            label="膳食纤维" 
            current={summary?.fiberG || 0} 
            total={fiberGoal} 
            color={Colors.danger} 
          />
        </View>
      </View>

      {/* 今日餐次记录 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ 今日餐次记录</Text>
        
        {records.length > 0 ? (
          records.map((record, index) => (
            <View key={record.id || index} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={[styles.mealIcon, { backgroundColor: index % 2 === 0 ? '#FFEDD5' : '#FEE2E2' }]}>
                  <Text style={{ fontSize: 24 }}>{getMealIcon(record.mealType)}</Text>
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealType}>{getMealName(record.mealType)} {formatTime(record.createdAt)}</Text>
                  <Text style={styles.mealFood}>
                    {record.items?.map(i => i.foodName).join(' + ') || '无食物记录'}
                  </Text>
                </View>
                <View style={styles.mealCalories}>
                  <Text style={[styles.calorieValue, record.totalCalories > 800 && { color: Colors.danger }]}>
                    {Math.round(record.totalCalories)}
                  </Text>
                  <Text style={styles.calorieUnit}>kcal</Text>
                </View>
              </View>
              <View style={styles.mealNutrients}>
                <Text style={styles.nutrientTag}>蛋白质 {Math.round(record.totalProtein)}g</Text>
                <Text style={styles.nutrientTag}>碳水 {Math.round(record.totalCarbs)}g</Text>
                <Text style={styles.nutrientTag}>脂肪 {Math.round(record.totalFat)}g</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>今天还没有记录哦</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.mealCard, styles.addMealCard]}
          onPress={() => navigation.navigate('Main', { screen: 'RecordTab' })}
        >
          <View style={styles.addMealContent}>
            <Ionicons name="add" size={24} color={Colors.textMuted} />
            <Text style={styles.addMealText}>添加饮食记录</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* AI建议 */}
      <View style={[styles.card, styles.aiCard]}>
        <View style={styles.aiHeader}>
          <Text style={{ fontSize: 24, marginRight: 8 }}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>今日饮食建议</Text>
            <Text style={styles.aiContent}>
              {calorieConsumed < calorieGoal * 0.5 
                ? '您今日的热量摄入偏低，建议适当增加营养摄入，保持均衡饮食。'
                : calorieConsumed > calorieGoal
                ? '您今日的热量摄入已超标，建议晚餐清淡一些，多吃蔬菜水果。'
                : '您今日的热量摄入合理，继续保持良好的饮食习惯！'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
              <Text style={styles.aiLink}>咨询AI获取建议 →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

// 本周视图组件
const WeekView: React.FC<{ summary: WeeklySummary | null }> = ({ summary }) => {
  const avgCalories = summary?.avgDailyCalories || 0;
  const healthScore = summary?.healthScore || 0;
  const compliantDays = summary?.compliantDays || 0;
  const totalDays = summary?.totalDays || 7;
  const complianceRate = totalDays > 0 ? Math.round((compliantDays / totalDays) * 100) : 0;
  
  // 生成趋势数据
  const trendData = summary?.dailyTrends?.map(d => d.calories) || [0, 0, 0, 0, 0, 0, 0];
  const trendLabels = summary?.dailyTrends?.map((d, i) => 
    ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i] || `第${i+1}天`
  ) || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <>
      <View style={styles.statsGrid}>
        <StatCard 
          value={Math.round(avgCalories).toLocaleString()} 
          label="平均日摄入" 
          subtext={avgCalories > 2500 ? '偏高' : avgCalories < 1200 ? '偏低' : '合理范围'} 
          color={Colors.text} 
        />
        <StatCard 
          value={healthScore.toString()} 
          label="周健康评分" 
          subtext={healthScore >= 80 ? '良好' : healthScore >= 60 ? '一般' : '需改善'} 
          color={healthScore >= 80 ? Colors.success : healthScore >= 60 ? Colors.warning : Colors.danger} 
        />
        <StatCard 
          value={`${compliantDays}/${totalDays}`} 
          label="合规天数" 
          subtext={`达标率 ${complianceRate}%`} 
          color={complianceRate >= 70 ? Colors.success : Colors.warning} 
        />
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, { textAlign: 'center' }]}>🎯 本周营养均衡度</Text>
        <RadarChart score={healthScore} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📈 每日热量趋势</Text>
          <Text style={styles.cardSubtitle}>本周数据</Text>
        </View>
        <BarChart 
          data={trendData.length > 0 ? trendData : [1650, 1950, 1350, 2100, 2400, 1500, 1200]} 
          labels={trendLabels} 
        />
      </View>

      <View style={[styles.card, styles.aiCard]}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>🤖</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTitle}>本周饮食分析</Text>
          <Text style={styles.aiContent}>
            {complianceRate >= 80 
              ? '本周整体饮食非常健康，保持良好的饮食习惯！'
              : complianceRate >= 50
              ? '本周饮食较为健康，但仍有改善空间，建议控制高热量食物的摄入。'
              : '本周饮食需要改善，建议制定合理的饮食计划，保持规律用餐。'}
          </Text>
        </View>
      </View>
    </>
  );
};

// 本月视图组件
const MonthView: React.FC<{ summary: MonthlySummary | null }> = ({ summary }) => {
  const avgCalories = summary?.avgDailyCalories || 0;
  const healthScore = summary?.healthScore || 0;
  const compliantDays = summary?.compliantDays || 0;
  const totalDays = summary?.totalDays || 30;
  const complianceRate = totalDays > 0 ? Math.round((compliantDays / totalDays) * 100) : 0;
  
  // 生成周趋势数据
  const weeklyData = summary?.weeklyTrends?.map(w => w.avgCalories) || [0, 0, 0, 0];
  const weeklyLabels = summary?.weeklyTrends?.map((w, i) => `第${w.week}周`) || ['第1周', '第2周', '第3周', '第4周'];

  return (
    <>
      <View style={styles.statsGrid}>
        <StatCard 
          value={Math.round(avgCalories).toLocaleString()} 
          label="平均日摄入" 
          subtext={avgCalories > 2500 ? '↑ 偏高' : avgCalories < 1200 ? '↓ 偏低' : '→ 稳定'} 
          color={Colors.text} 
        />
        <StatCard 
          value={healthScore.toString()} 
          label="月健康评分" 
          subtext={healthScore >= 80 ? '良好' : healthScore >= 60 ? '一般' : '需改善'} 
          color={healthScore >= 80 ? Colors.success : healthScore >= 60 ? Colors.warning : Colors.danger} 
        />
        <StatCard 
          value={`${compliantDays}/${totalDays}`} 
          label="合规天数" 
          subtext={`达标率 ${complianceRate}%`} 
          color={complianceRate >= 70 ? Colors.success : Colors.warning} 
        />
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, { textAlign: 'center' }]}>🎯 本月营养均衡度</Text>
        <RadarChart score={healthScore} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📈 每周热量趋势</Text>
          <Text style={styles.cardSubtitle}>周均值</Text>
        </View>
        <BarChart 
          data={weeklyData.length > 0 ? weeklyData : [1850, 1920, 2100, 1780]} 
          labels={weeklyLabels} 
        />
      </View>
    </>
  );
};

// 历史视图组件
const HistoryView: React.FC = () => {
  // 这里应该从后端获取真实的历史统计数据
  // 目前使用模拟数据，显示0而不是"加载中"
  const historyStats = {
    totalDays: 0,
    avgScore: 0,
    complianceRate: 0,
    hasData: false,
  };

  // 生成最近3个月的历史数据
  const months = [
    { label: format(new Date(), 'yyyy年M月'), value: new Date(), hasData: false },
    { label: format(subMonths(new Date(), 1), 'yyyy年M月'), value: subMonths(new Date(), 1), hasData: false },
    { label: format(subMonths(new Date(), 2), 'yyyy年M月'), value: subMonths(new Date(), 2), hasData: false },
  ];

  // 检查是否有数据的月份
  const monthsWithData = months.filter(m => m.hasData);

  return (
    <>
      {/* 按日查看 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 按日查看</Text>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>暂无数据</Text>
          <Text style={styles.emptyStateSubtext}>记录饮食后将显示每日统计</Text>
        </View>
      </View>

      {/* 按周查看 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 按周查看</Text>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>暂无数据</Text>
          <Text style={styles.emptyStateSubtext}>记录饮食后将显示周统计</Text>
        </View>
      </View>

      {/* 按月查看 - 只显示有数据的月份 */}
      {monthsWithData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 按月查看</Text>
          {monthsWithData.map((month, index) => (
            <TouchableOpacity key={index} style={styles.historyCard}>
              <View style={styles.historyIcon}>
                <Text style={{ fontSize: 20 }}>📅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{month.label}</Text>
                <Text style={styles.historySubtitle}>点击查看详情</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 历史统计概览 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 历史统计概览</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            value={historyStats.totalDays.toString()} 
            label="总记录天数" 
            subtext="累计记录" 
            color={Colors.text} 
          />
          <StatCard 
            value={historyStats.avgScore.toString()} 
            label="历史均分" 
            subtext="平均分" 
            color={Colors.text} 
          />
          <StatCard 
            value={`${historyStats.complianceRate}%`} 
            label="历史达标率" 
            subtext="达标天数占比" 
            color={Colors.text} 
          />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentWrapper: {
    padding: 16,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentItemActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  nutrientsList: {
    gap: 16,
  },
  nutrientRow: {
    marginBottom: 4,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutrientLabel: {
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
  nutrientSource: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  addMealCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  addMealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addMealText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFEDD5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  mealFood: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  calorieUnit: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  mealNutrients: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nutrientTag: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  aiCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    flexDirection: 'row',
  },
  aiHeader: {
    flexDirection: 'row',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  aiContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  aiLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  radarScore: {
    position: 'absolute',
    alignItems: 'center',
  },
  radarScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  radarScoreLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chartContainer: {
    height: 200,
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 20,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: '60%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 150,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barValue: {
    position: 'absolute',
    top: -20,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  historySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyStateCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});

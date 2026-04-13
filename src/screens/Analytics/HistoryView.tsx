import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Theme } from '../../constants/Theme';
import { DietService } from '../../services/api';
import CalendarPicker from '../../components/CalendarPicker';

type ViewMode = 'day' | 'week' | 'month';

interface HistoryViewProps {
  navigation: any;
  onNavigateToTab: (tabIndex: number, params?: any) => void;
}

export default function HistoryView({ navigation, onNavigateToTab }: HistoryViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // 数据状态
  const [datesWithRecords, setDatesWithRecords] = useState<string[]>([]);
  const [weeksWithRecords, setWeeksWithRecords] = useState<Array<{
    weekStart: string;
    weekEnd: string;
    recordCount: number;
  }>>([]);
  const [monthsWithRecords, setMonthsWithRecords] = useState<Array<{
    month: string;
    label: string;
  }>>([]);

  // 加载有记录的日期列表
  const loadDatesWithRecords = useCallback(async () => {
    try {
      const res = await DietService.getDatesWithRecords(365);
      if (res.code === 0 && res.data) {
        setDatesWithRecords(res.data.dates.map(d => d.date));
      }
    } catch (error) {
      console.error('加载日期列表失败:', error);
    }
  }, []);

  // 加载有记录的周列表
  const loadWeeksWithRecords = useCallback(async () => {
    try {
      const res = await DietService.getWeeksWithRecords(52);
      if (res.code === 0 && res.data) {
        setWeeksWithRecords(res.data.weeks);
      }
    } catch (error) {
      console.error('加载周列表失败:', error);
    }
  }, []);

  // 加载有记录的月列表
  const loadMonthsWithRecords = useCallback(async () => {
    try {
      const res = await DietService.getMonthsWithRecords(24);
      if (res.code === 0 && res.data) {
        setMonthsWithRecords(res.data.months);
      }
    } catch (error) {
      console.error('加载月列表失败:', error);
    }
  }, []);

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadDatesWithRecords(),
      loadWeeksWithRecords(),
      loadMonthsWithRecords(),
    ]);
    setIsLoading(false);
  }, [loadDatesWithRecords, loadWeeksWithRecords, loadMonthsWithRecords]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  // 初始加载
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 处理日期选择
  const handleDateSelect = (date: string) => {
    onNavigateToTab(0, { date }); // 跳转到今日标签页，并传递日期参数
  };

  // 处理周选择
  const handleWeekSelect = (weekStart: string) => {
    onNavigateToTab(1, { weekStart }); // 跳转到本周标签页，并传递周开始日期
  };

  // 处理月选择
  const handleMonthSelect = (month: string) => {
    onNavigateToTab(2, { month }); // 跳转到本月标签页，并传递月份
  };

  // 渲染切换按钮
  const renderModeSwitch = () => (
    <View style={styles.modeSwitch}>
      <TouchableOpacity
        style={[styles.modeButton, viewMode === 'day' && styles.modeButtonActive]}
        onPress={() => setViewMode('day')}
      >
        <Text style={[styles.modeButtonText, viewMode === 'day' && styles.modeButtonTextActive]}>
          按日
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, viewMode === 'week' && styles.modeButtonActive]}
        onPress={() => setViewMode('week')}
      >
        <Text style={[styles.modeButtonText, viewMode === 'week' && styles.modeButtonTextActive]}>
          按周
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, viewMode === 'month' && styles.modeButtonActive]}
        onPress={() => setViewMode('month')}
      >
        <Text style={[styles.modeButtonText, viewMode === 'month' && styles.modeButtonTextActive]}>
          按月
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染按日查看
  const renderDayView = () => {
    if (datesWithRecords.length === 0) {
      return (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateIcon}>📅</Text>
          <Text style={styles.emptyStateText}>暂无日记录</Text>
          <Text style={styles.emptyStateSubtext}>记录饮食后将显示每日统计</Text>
        </View>
      );
    }

    // 按月份分组
    const groupedByMonth: { [key: string]: string[] } = {};
    datesWithRecords.forEach(date => {
      const monthKey = date.substring(0, 7); // '2024-03'
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = [];
      }
      groupedByMonth[monthKey].push(date);
    });

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 按日查看</Text>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={Theme.colors.primary} />
            <Text style={styles.calendarButtonText}>日历</Text>
          </TouchableOpacity>
        </View>

        {Object.entries(groupedByMonth).map(([month, dates]) => (
          <View key={month} style={styles.monthGroup}>
            <Text style={styles.monthGroupTitle}>
              {month.replace('-', '年')}月
            </Text>
            <View style={styles.daysGrid}>
              {dates.map(date => {
                const dateObj = new Date(date);
                const day = dateObj.getDate();
                const weekDay = format(dateObj, 'EEE', { locale: zhCN });
                
                return (
                  <TouchableOpacity
                    key={date}
                    style={styles.dayCard}
                    onPress={() => handleDateSelect(date)}
                  >
                    <Text style={styles.dayNumber}>{day}</Text>
                    <Text style={styles.dayWeek}>{weekDay}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 渲染按周查看
  const renderWeekView = () => {
    if (weeksWithRecords.length === 0) {
      return (
        <View style={styles.emptyStateCard}>
          <Ionicons name="bar-chart" size={48} color={Theme.colors.textMuted} />
          <Text style={styles.emptyStateText}>暂无周记录</Text>
          <Text style={styles.emptyStateSubtext}>记录饮食后将显示周统计</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>按周查看</Text>
        {weeksWithRecords.map((week, index) => {
          const startDate = new Date(week.weekStart);
          const endDate = new Date(week.weekEnd);
          const monthLabel = format(startDate, 'yyyy年M月');
          
          return (
            <TouchableOpacity
              key={week.weekStart}
              style={styles.historyCard}
              onPress={() => handleWeekSelect(week.weekStart)}
            >
              <View style={styles.historyIcon}>
                <Ionicons name="bar-chart" size={28} color={Theme.colors.primary} />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyTitle}>
                  {monthLabel} 第{index + 1}周
                </Text>
                <Text style={styles.historySubtitle}>
                  {format(startDate, 'M月d日')} - {format(endDate, 'M月d日')}
                  · {week.recordCount}条记录
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // 渲染按月查看
  const renderMonthView = () => {
    if (monthsWithRecords.length === 0) {
      return (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateIcon}>📅</Text>
          <Text style={styles.emptyStateText}>暂无月记录</Text>
          <Text style={styles.emptyStateSubtext}>记录饮食后将显示月统计</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 按月查看</Text>
        {monthsWithRecords.map((month) => (
          <TouchableOpacity
            key={month.month}
            style={styles.historyCard}
            onPress={() => handleMonthSelect(month.month)}
          >
            <View style={styles.historyIcon}>
              <Ionicons name="calendar-outline" size={28} color={Theme.colors.textMuted} />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>{month.label}</Text>
              <Text style={styles.historySubtitle}>点击查看月详情</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {renderModeSwitch()}
        
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 日历选择器 */}
      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDate={handleDateSelect}
        markedDates={datesWithRecords}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.xs,
    marginBottom: Theme.spacing.page,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Theme.spacing.compact,
    alignItems: 'center',
    borderRadius: Theme.radius.xs,
  },
  modeButtonActive: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  modeButtonText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.textSecondary,
  },
  modeButtonTextActive: {
    color: Theme.colors.primary,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.xs,
    gap: Theme.spacing.xs,
  },
  calendarButtonText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.primary,
  },
  monthGroup: {
    marginBottom: Theme.spacing.lg,
  },
  monthGroupTitle: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.compact,
    paddingLeft: Theme.spacing.xs,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  dayCard: {
    width: 56,
    height: 56,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  dayNumber: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  dayWeek: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  historyIcon: {
    width: 48,
    height: 48,
    backgroundColor: Theme.colors.highlight,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
  },
  historySubtitle: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  emptyStateCard: {
    backgroundColor: Theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
    borderRadius: Theme.radius.lg,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Theme.spacing.md,
  },
  emptyStateText: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.textMuted,
  },
  emptyStateSubtext: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
  },
});

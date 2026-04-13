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
import Colors from '../../constants/Colors';
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
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
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
          <Ionicons name="bar-chart" size={48} color={Colors.textMuted} />
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
                <Ionicons name="bar-chart" size={28} color={Colors.primary} />
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
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
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
              <Ionicons name="calendar-outline" size={28} color={Colors.textMuted} />
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>{month.label}</Text>
              <Text style={styles.historySubtitle}>点击查看月详情</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  modeButtonTextActive: {
    color: Colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  calendarButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  monthGroup: {
    marginBottom: 16,
  },
  monthGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
    paddingLeft: 4,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayCard: {
    width: 56,
    height: 56,
    backgroundColor: Colors.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  dayWeek: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  historyIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.highlight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  historySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyStateCard: {
    backgroundColor: Colors.card,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
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

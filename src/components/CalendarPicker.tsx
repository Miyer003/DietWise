import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

interface CalendarPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  markedDates?: string[]; // 有记录的日期列表 ['2024-03-01', ...]
  selectedDate?: string;
}

export default function CalendarPicker({
  visible,
  onClose,
  onSelectDate,
  markedDates = [],
  selectedDate,
}: CalendarPickerProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // 获取当月第一天是星期几
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // 获取当月天数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // 生成日历数据
  const generateCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const days: Array<{
      day: number;
      date: string;
      hasRecord: boolean;
      isSelected: boolean;
      isToday: boolean;
    } | null> = [];

    // 填充空白
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        hasRecord: markedDates.includes(dateStr),
        isSelected: dateStr === selectedDate,
        isToday: dateStr === today.toISOString().split('T')[0],
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDatePress = (date: string) => {
    onSelectDate(date);
    onClose();
  };

  const calendarDays = generateCalendarDays();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {currentYear}年{monthNames[currentMonth]}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* 星期标题 */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <Text
                key={index}
                style={[
                  styles.weekDayText,
                  index === 0 || index === 6 ? styles.weekendText : null,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {/* 日期网格 */}
          <View style={styles.daysGrid}>
            {calendarDays.map((dayData, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dayCell}
                onPress={() => dayData && handleDatePress(dayData.date)}
                disabled={!dayData}
                activeOpacity={0.7}
              >
                {dayData && (
                  <View
                    style={[
                      styles.dayContent,
                      // 优先级：选中 > 今天 > 有记录
                      dayData.isSelected && styles.selectedDay,
                      !dayData.isSelected && dayData.isToday && styles.today,
                      !dayData.isSelected && !dayData.isToday && dayData.hasRecord && styles.hasRecordDay,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        dayData.isSelected && styles.selectedDayText,
                        !dayData.isSelected && dayData.isToday && styles.todayText,
                        !dayData.isSelected && !dayData.isToday && dayData.hasRecord && styles.hasRecordDayText,
                      ]}
                    >
                      {dayData.day}
                    </Text>
                    {/* 只在今天显示标记 */}
                    {dayData.isToday && (
                      <Text style={styles.todayLabel}>今天</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 图例 */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>已选中</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.todayBox]} />
              <Text style={styles.legendText}>今天</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#DBEAFE' }]} />
              <Text style={styles.legendText}>有记录</Text>
            </View>
          </View>

          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  arrowButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  weekendText: {
    color: Colors.danger,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: (width - 40) / 7,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContent: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  // 有记录 - 蓝色底色
  hasRecordDay: {
    backgroundColor: '#DBEAFE',
  },
  hasRecordDayText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  // 今天 - 蓝色边框圈起来
  today: {
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  todayText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  todayLabel: {
    position: 'absolute',
    bottom: -2,
    fontSize: 8,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  // 选中 - 主色填充
  selectedDay: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.1 }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
  },
  todayBox: {
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  legendText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
});

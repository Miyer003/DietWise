import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
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
              >
                {dayData && (
                  <View
                    style={[
                      styles.dayContent,
                      dayData.isSelected && styles.selectedDay,
                      dayData.isToday && !dayData.isSelected && styles.today,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        dayData.isSelected && styles.selectedDayText,
                        dayData.isToday && !dayData.isSelected && styles.todayText,
                      ]}
                    >
                      {dayData.day}
                    </Text>
                    {dayData.hasRecord && (
                      <View style={styles.recordDot} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* 图例 */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.recordDot]} />
              <Text style={styles.legendText}>有记录</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.todayDot]} />
              <Text style={styles.legendText}>今天</Text>
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
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayContent: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    position: 'relative',
  },
  dayText: {
    fontSize: 14,
    color: Colors.text,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  todayText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  recordDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  todayDot: {
    backgroundColor: Colors.primary,
    position: 'relative',
    bottom: 0,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
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

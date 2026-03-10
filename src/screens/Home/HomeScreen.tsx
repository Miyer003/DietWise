import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';
import { DailySummary, DietRecord } from '../../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const { width } = Dimensions.get('window');

// 环形进度条组件（对应原型SVG）
const CircularProgress: React.FC<{ progress: number; consumed: number; goal: number }> = ({
  progress,
  consumed,
  goal,
}) => {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
          stroke={Colors.primary}
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
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

// 营养进度条（蛋白质/碳水/脂肪）
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

// AI建议卡片（对应原型中的渐变卡片）
const AICard: React.FC<{ onConsult: () => void; onDetail: () => void }> = ({ onConsult, onDetail }) => {
  const [tip, setTip] = useState('根据您近期的饮食数据，蔬菜摄入量较低，建议今晚增加一份清炒时蔬。');

  const tips = [
    "根据您近期的饮食数据，蔬菜摄入量较低，建议今晚增加一份清炒时蔬。",
    "您今日的蛋白质摄入充足，保持得很好！记得多喝水促进代谢。",
    "连续3天早餐规律，这是一个很好的习惯，请继续保持。",
    "本周钠摄入较高，建议减少外卖和加工食品的摄入。",
  ];

  const refreshTip = () => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setTip(randomTip);
  };

  return (
    <View style={styles.aiCard}>
      <View style={styles.aiCardHeader}>
        <View style={styles.aiIcon}>
          <Text style={styles.aiIconText}>🤖</Text>
        </View>
        <View style={styles.aiTitleContainer}>
          <Text style={styles.aiTitle}>AI营养顾问建议</Text>
          <TouchableOpacity onPress={refreshTip}>
            <Text style={styles.aiTime}>刷新</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.aiContent}>{tip}</Text>
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

// 时间线项目（对应原型中的今日记录）
const TimelineItem: React.FC<{ record: any; isLast?: boolean }> = ({ record, isLast }) => {
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
            <Text style={styles.timelineTime}>08:30</Text>
          </View>
          <Text style={styles.timelineFood}>包子 + 豆浆</Text>
          <Text style={styles.timelineCalories}>{record.total_calories} kcal</Text>
        </View>
      </View>
    </View>
  );
};

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [dailyData, setDailyData] = useState<DailySummary | null>(null);

  // 模拟数据（后续替换为API调用）
  useEffect(() => {
    const mockData: DailySummary = {
      date: format(new Date(), 'yyyy-MM-dd'),
      calorie_goal: profile?.daily_calorie_goal || 2000,
      calorie_consumed: 1250,
      calorie_remaining: 750,
      protein_g: 80,
      carbs_g: 180,
      fat_g: 32,
      health_score: 85,
      meal_records: [
        {
          id: '1',
          record_date: format(new Date(), 'yyyy-MM-dd'),
          meal_type: 'breakfast',
          total_calories: 450,
          total_protein: 15,
          total_carbs: 65,
          total_fat: 8,
          input_method: 'photo',
          items: [],
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          record_date: format(new Date(), 'yyyy-MM-dd'),
          meal_type: 'lunch',
          total_calories: 800,
          total_protein: 35,
          total_carbs: 85,
          total_fat: 22,
          input_method: 'manual',
          items: [],
          created_at: new Date().toISOString(),
        },
      ],
    };
    setDailyData(mockData);
  }, []);

  const progress = dailyData ? (dailyData.calorie_consumed / dailyData.calorie_goal) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarEmoji}>{user?.avatar_emoji || '😊'}</Text>
          </TouchableOpacity>
        </View>

        {/* 环形进度图 */}
        <View style={styles.progressContainer}>
          <CircularProgress 
            progress={progress} 
            consumed={dailyData?.calorie_consumed || 0}
            goal={dailyData?.calorie_goal || 2000}
          />
        </View>

        {/* 营养进度条 */}
        <View style={styles.nutrientsContainer}>
          <NutrientBar label="蛋白质" current={80} total={100} color={Colors.primary} />
          <NutrientBar label="碳水" current={180} total={300} color={Colors.warning} />
          <NutrientBar label="脂肪" current={32} total={80} color="#F97316" />
        </View>

        {/* AI智能建议卡片 */}
        <View style={styles.sectionPadding}>
          <AICard 
            onConsult={() => navigation.navigate('Consult')}
            onDetail={() => navigation.navigate('Analytics')}
          />
        </View>

        {/* 今日记录时间线 */}
        <View style={styles.timelineSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 今日记录</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
              <Text style={styles.sectionLink}>查看全部 →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            {dailyData?.meal_records.map((record, index) => (
              <TimelineItem 
                key={record.id} 
                record={record} 
                isLast={index === dailyData.meal_records.length - 1}
              />
            ))}
            
            {/* 添加记录入口 */}
            <TouchableOpacity 
              style={styles.addRecordItem}
              onPress={() => navigation.navigate('Record')}
            >
              <View style={styles.addRecordIcon}>
                <Text style={styles.addRecordPlus}>+</Text>
              </View>
              <Text style={styles.addRecordText}>点击添加晚餐记录...</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部留白（避免被Tab栏遮挡） */}
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
    color: Colors.primary,
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
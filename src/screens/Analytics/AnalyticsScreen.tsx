import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';
import Colors from '../../constants/Colors';

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
  const percent = Math.min((current / total) * 100, 100);
  const isLow = percent < 50;
  
  return (
    <View style={styles.nutrientRow}>
      <View style={styles.nutrientHeader}>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <Text style={[styles.nutrientValue, isLow && { color: Colors.danger }]}>
          {current}g / {total}g
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
  // 六边形雷达图简化版
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

// 柱状图（简化版）
const BarChart: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
  const max = Math.max(...data);
  
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
                    backgroundColor: index === 2 ? Colors.primary : '#E5E7EB'
                  }
                ]} 
              />
              <Text style={styles.barValue}>{value}</Text>
            </View>
            <Text style={styles.barLabel}>{labels[index]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function AnalyticsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState(0); // 0:今日, 1:本周, 2:本月, 3:历史
  const tabs = ['今日', '本周', '本月', '历史'];

  // 根据选中标签渲染不同内容
  const renderContent = () => {
    switch(activeTab) {
      case 0: // 今日视图
        return <TodayView navigation={navigation} />;
      case 1: // 本周视图
        return <WeekView />;
      case 2: // 本月视图
        return <MonthView />;
      case 3: // 历史视图
        return <HistoryView />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
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
const TodayView: React.FC<{ navigation: any }> = ({ navigation }) => (
  <>
    {/* 概览卡片 */}
    <View style={styles.statsGrid}>
      <StatCard value="1,250" label="今日摄入" subtext="剩余 750" color={Colors.text} />
      <StatCard value="2" label="已记录餐次" subtext="目标 3餐" color={Colors.text} />
      <StatCard value="85" label="健康评分" subtext="优秀" color={Colors.success} />
    </View>

    {/* 营养成分分析 */}
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🥜 营养成分分析</Text>
      <View style={styles.nutrientsList}>
        <NutrientBar label="蛋白质" current={80} total={100} color={Colors.primary} source="包子、红烧肉" />
        <NutrientBar label="碳水化合物" current={180} total={300} color={Colors.warning} source="米饭、面包" />
        <NutrientBar label="脂肪" current={32} total={80} color="#F97316" source="红烧肉饭" />
        <NutrientBar label="膳食纤维" current={8} total={25} color={Colors.danger} />
        <NutrientBar label="维生素C" current={45} total={100} color="#EAB308" source="豆浆" />
      </View>
    </View>

    {/* 今日餐次记录 */}
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🍽️ 今日餐次记录</Text>
      
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={styles.mealIcon}>
            <Text style={{ fontSize: 24 }}>🍳</Text>
          </View>
          <View style={styles.mealInfo}>
            <Text style={styles.mealType}>早餐 08:30</Text>
            <Text style={styles.mealFood}>包子 + 豆浆</Text>
          </View>
          <View style={styles.mealCalories}>
            <Text style={styles.calorieValue}>450</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
          </View>
        </View>
        <View style={styles.mealNutrients}>
          <Text style={styles.nutrientTag}>蛋白质 15g</Text>
          <Text style={styles.nutrientTag}>碳水 65g</Text>
          <Text style={styles.nutrientTag}>脂肪 8g</Text>
        </View>
      </View>

      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <View style={[styles.mealIcon, { backgroundColor: '#FEE2E2' }]}>
            <Text style={{ fontSize: 24 }}>🍱</Text>
          </View>
          <View style={styles.mealInfo}>
            <Text style={styles.mealType}>午餐 12:15</Text>
            <Text style={styles.mealFood}>红烧肉饭</Text>
          </View>
          <View style={styles.mealCalories}>
            <Text style={[styles.calorieValue, { color: Colors.danger }]}>800</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
          </View>
        </View>
        <View style={styles.mealNutrients}>
          <Text style={styles.nutrientTag}>蛋白质 35g</Text>
          <Text style={styles.nutrientTag}>碳水 85g</Text>
          <Text style={styles.nutrientTag}>脂肪 22g</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.mealCard, styles.addMealCard]}
        onPress={() => navigation.navigate('Record')}
      >
        <View style={styles.addMealContent}>
          <Ionicons name="add" size={24} color={Colors.textMuted} />
          <Text style={styles.addMealText}>添加晚餐记录</Text>
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
            您今日的蛋白质摄入充足，但蔬菜摄入明显不足。建议晚餐选择清炒时蔬或沙拉，补充膳食纤维和维生素。
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
            <Text style={styles.aiLink}>咨询AI获取晚餐建议 →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </>
);

// 本周视图组件
const WeekView: React.FC = () => (
  <>
    <View style={styles.statsGrid}>
      <StatCard value="1,785" label="平均日摄入" subtext="合理范围" color={Colors.text} />
      <StatCard value="82" label="周健康评分" subtext="良好" color={Colors.success} />
      <StatCard value="5/7" label="合规天数" subtext="达标率 71%" color={Colors.warning} />
    </View>

    <View style={styles.card}>
      <Text style={[styles.cardTitle, { textAlign: 'center' }]}>🎯 本周营养均衡度</Text>
      <RadarChart score={82} />
    </View>

    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>📈 每日热量趋势</Text>
        <Text style={styles.cardSubtitle}>3月1日-3月7日</Text>
      </View>
      <BarChart 
        data={[1650, 1950, 1350, 2100, 2400, 1500, 1200]} 
        labels={['周1', '周2', '周3', '周4', '周5', '周6', '周7']} 
      />
    </View>

    <View style={[styles.card, styles.aiCard]}>
      <Text style={{ fontSize: 24, marginRight: 8 }}>🤖</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.aiTitle}>本周饮食分析</Text>
        <Text style={styles.aiContent}>
          本周整体饮食较为健康，但周五热量摄入明显超标。建议下周控制高油腻食物的摄入，并保持蔬菜摄入的稳定性。
        </Text>
      </View>
    </View>
  </>
);

// 本月视图组件
const MonthView: React.FC = () => (
  <>
    <View style={styles.statsGrid}>
      <StatCard value="1,820" label="平均日摄入" subtext="↓ 3%" color={Colors.text} />
      <StatCard value="79" label="月健康评分" subtext="良好" color={Colors.success} />
      <StatCard value="22/31" label="合规天数" subtext="达标率 71%" color={Colors.warning} />
    </View>

    <View style={styles.card}>
      <Text style={[styles.cardTitle, { textAlign: 'center' }]}>🎯 3月营养均衡度</Text>
      <RadarChart score={79} />
    </View>

    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>📈 每周热量趋势</Text>
        <Text style={styles.cardSubtitle}>周均值</Text>
      </View>
      <BarChart 
        data={[1850, 1920, 2100, 1780, 1420]} 
        labels={['第1周', '第2周', '第3周', '第4周', '第5周']} 
      />
    </View>
  </>
);

// 历史视图组件
const HistoryView: React.FC = () => (
  <>
    <View style={styles.statsGrid}>
      <StatCard value="45" label="总记录天数" subtext="加入 15天" color={Colors.text} />
      <StatCard value="78" label="历史均分" subtext="良好" color={Colors.success} />
      <StatCard value="68%" label="历史达标率" subtext="继续努力" color={Colors.warning} />
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 按月查看</Text>
      {['2025年3月', '2025年2月', '2025年1月'].map((month, index) => (
        <TouchableOpacity key={index} style={styles.historyCard}>
          <View style={styles.historyIcon}>
            <Text style={{ fontSize: 20 }}>📅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyTitle}>{month}</Text>
            <Text style={styles.historySubtitle}>
              {index === 0 ? '已记录 7 天 • 22天合规' : index === 1 ? '已记录 28 天 • 18天合规' : '无记录'}
            </Text>
          </View>
          <View style={styles.historyScore}>
            <Text style={[styles.scoreValue, index === 2 && { color: Colors.textMuted }]}>
              {index === 2 ? '--' : index === 0 ? '79' : '76'}
            </Text>
            <Text style={styles.scoreLabel}>评分</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </>
);

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
  aiCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
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
  historyScore: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
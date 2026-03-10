import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function MealPlanScreen({ navigation }: any) {
  const [calories, setCalories] = useState(2000);
  const [mealCount, setMealCount] = useState(3);
  const [goal, setGoal] = useState<'减脂' | '增肌' | '维持'>('减脂');
  const [preferences, setPreferences] = useState<string[]>(['清淡']);

  const togglePreference = (pref: string) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  const preferenceOptions = ['清淡', '微辣', '无辣不欢', '少油', '低糖', '高蛋白'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 当前状态卡片 */}
        <View style={[styles.statusCard, { backgroundColor: '#FFEDD5' }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: Colors.warning }]}>
              <Text style={{ fontSize: 24 }}>🥡</Text>
            </View>
            <View>
              <Text style={styles.statusTitle}>当前饮食计划</Text>
              <Text style={styles.statusSubtitle}>未设置食谱</Text>
            </View>
          </View>
          <View style={styles.statusStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>每日摄入</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>每日餐数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>--</Text>
              <Text style={styles.statLabel}>饮食目标</Text>
            </View>
          </View>
        </View>

        {/* 自定义设置 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>自定义设置</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>手动调整</Text>
            </View>
          </View>

          {/* 卡路里滑块 */}
          <View style={styles.card}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>每日摄入量</Text>
              <Text style={styles.sliderValue}>{calories} kcal</Text>
            </View>
            // 替换原来的 Slider 部分
            <View style={styles.sliderContainer}>
                <Text style={styles.sliderMin}>1200</Text>
                <TouchableOpacity 
                    style={styles.sliderTrack}
                    onPressIn={(e) => {
                    // 简化版：点击设置数值
                    const x = e.nativeEvent.locationX;
                    const percentage = x / 200; // 假设宽度200
                    const newCal = Math.round(1200 + percentage * 2300);
                    setCalories(Math.max(1200, Math.min(3500, newCal)));
                    }}
                >
                    <View style={[styles.sliderFill, { width: `${((calories - 1200) / 2300) * 100}%` }]} />
                </TouchableOpacity>
                <Text style={styles.sliderMax}>3500</Text>
            </View>
          </View>

          {/* 餐数选择 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>每日餐数</Text>
            <View style={styles.segmentControl}>
              {[2, 3, 4, 5].map((count) => (
                <TouchableOpacity 
                  key={count}
                  style={[styles.segmentBtn, mealCount === count && styles.segmentBtnActive]}
                  onPress={() => setMealCount(count)}
                >
                  <Text style={[styles.segmentText, mealCount === count && styles.segmentTextActive]}>
                    {count}餐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 饮食目标 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>饮食目标</Text>
            <View style={styles.segmentControl}>
              {(['减脂', '增肌', '维持'] as const).map((g) => (
                <TouchableOpacity 
                  key={g}
                  style={[styles.segmentBtn, goal === g && styles.segmentBtnActive]}
                  onPress={() => setGoal(g)}
                >
                  <Text style={[styles.segmentText, goal === g && styles.segmentTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 口味偏好 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>口味偏好（可多选）</Text>
            <View style={styles.preferencesContainer}>
              {preferenceOptions.map((pref) => (
                <TouchableOpacity 
                  key={pref}
                  style={[
                    styles.preferenceTag,
                    preferences.includes(pref) && styles.preferenceTagActive
                  ]}
                  onPress={() => togglePreference(pref)}
                >
                  <Text style={[
                    styles.preferenceText,
                    preferences.includes(pref) && styles.preferenceTextActive
                  ]}>
                    {pref}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 智能定制入口 */}
        <TouchableOpacity style={[styles.card, styles.aiCard]}>
          <View style={styles.aiCardContent}>
            <View style={[styles.aiIcon, { backgroundColor: Colors.primary }]}>
              <Text style={{ fontSize: 24 }}>🤖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiCardTitle}>智能定制食谱</Text>
              <Text style={styles.aiCardDesc}>不确定怎么设置？让AI帮您定制</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>💾 保存食谱设置</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  statusCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  badge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.warning,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderMin: {
    fontSize: 12,
    color: Colors.textMuted,
    width: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 3,
  },
  sliderMax: {
    fontSize: 12,
    color: Colors.textMuted,
    width: 40,
    textAlign: 'right',
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: Colors.primary,
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  preferenceTagActive: {
    backgroundColor: Colors.primary,
  },
  preferenceText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  preferenceTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  aiCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  aiCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    margin: 16,
    backgroundColor: Colors.warning,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
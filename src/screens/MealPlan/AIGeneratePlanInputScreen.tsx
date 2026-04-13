import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';

interface AIGeneratePlanInputScreenProps {
  navigation: any;
  route: {
    params?: {
      initialCalories?: number;
      initialMealCount?: number;
      initialGoal?: string;
      initialPreferences?: string[];
    };
  };
}

type HealthGoal = '减脂' | '增肌' | '维持';

const MEAL_COUNT_OPTIONS = [2, 3, 4, 5];
const HEALTH_GOALS: { value: HealthGoal; label: string; icon: React.ComponentProps<typeof Ionicons>['name']; desc: string }[] = [
  { value: '减脂', label: '减脂', icon: 'flame-outline', desc: '控制热量，健康瘦身' },
  { value: '增肌', label: '增肌', icon: 'barbell-outline', desc: '高蛋白，助力肌肉生长' },
  { value: '维持', label: '维持', icon: 'fitness-outline', desc: '均衡饮食，保持健康体重' },
];
const PREFERENCE_OPTIONS: { value: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: '清淡', icon: 'leaf-outline' },
  { value: '微辣', icon: 'flame-outline' },
  { value: '无辣不欢', icon: 'flame' },
  { value: '少油', icon: 'water-outline' },
  { value: '低糖', icon: 'cube-outline' },
  { value: '高蛋白', icon: 'nutrition-outline' },
  { value: '素食', icon: 'flower-outline' },
  { value: '低碳水', icon: 'pizza-outline' },
];
const DIETARY_RESTRICTIONS = [
  { value: '无麸质', desc: '避免小麦、大麦等' },
  { value: '无乳制品', desc: '避免牛奶、奶酪等' },
  { value: '无海鲜', desc: '避免鱼、虾、蟹等' },
  { value: '无坚果', desc: '避免花生、核桃等' },
];

export default function AIGeneratePlanInputScreen({ navigation, route }: AIGeneratePlanInputScreenProps) {
  const { profile } = useAuth();
  const params = route.params || {};

  // 基础设置
  const [calories, setCalories] = useState<number>(params.initialCalories || profile?.dailyCalorieGoal || 2000);
  const [mealCount, setMealCount] = useState(params.initialMealCount || profile?.mealCount || 3);
  const [goal, setGoal] = useState<HealthGoal>((params.initialGoal as HealthGoal) || (profile?.healthGoal as HealthGoal) || '维持');
  const [preferences, setPreferences] = useState<string[]>(params.initialPreferences || profile?.flavorPrefs || []);

  // 热量输入弹窗
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [tempCalories, setTempCalories] = useState(String(calories));

  // 高级设置
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState('');
  const [includeSnack, setIncludeSnack] = useState(false);
  const [cookingDifficulty, setCookingDifficulty] = useState<'简单' | '中等' | '复杂'>('中等');

  const togglePreference = (pref: string) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  const toggleRestriction = (restriction: string) => {
    if (restrictions.includes(restriction)) {
      setRestrictions(restrictions.filter(r => r !== restriction));
    } else {
      setRestrictions([...restrictions, restriction]);
    }
  };

  // 打开热量输入弹窗
  const openCalorieModal = useCallback(() => {
    setTempCalories(String(calories));
    setShowCalorieModal(true);
  }, [calories]);

  // 确认热量输入
  const confirmCalorieInput = useCallback(() => {
    const value = parseInt(tempCalories, 10);
    if (isNaN(value) || value < 1200 || value > 3500) {
      Alert.alert('输入错误', '请输入 1200-3500 之间的数值');
      return;
    }
    setCalories(value);
    setShowCalorieModal(false);
  }, [tempCalories]);

  const handleGenerate = () => {
    // 构建请求参数
    const requestParams = {
      calorieTarget: calories,
      mealCount: includeSnack ? mealCount + 1 : mealCount,
      healthGoal: goal,
      flavorPrefs: preferences,
      restrictions,
      customRequest: customRequest.trim(),
      cookingDifficulty,
      heightCm: profile?.heightCm,
      weightKg: profile?.weightKg,
    };

    // 跳转到预览页面
    navigation.navigate('AIGeneratePlanPreview', {
      requestParams,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI 定制食谱</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 介绍卡片 */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="sparkles" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.introTitle}>告诉 AI 你的需求</Text>
          <Text style={styles.introDesc}>
            AI 会根据你的身体数据、饮食目标和口味偏好，为你生成专属的一周食谱
          </Text>
        </View>

        {/* 基础设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基础设置</Text>

          {/* 每日热量 */}
          <View style={styles.card}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>每日热量目标</Text>
              <TouchableOpacity style={styles.calorieInputBtn} onPress={openCalorieModal}>
                <Text style={styles.calorieInputValue}>{calories}</Text>
                <Text style={styles.calorieInputUnit}>kcal</Text>
                <Ionicons name="pencil" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderMin}>1200</Text>
              <TouchableOpacity
                style={styles.sliderTrack}
                onPressIn={(e) => {
                  const x = e.nativeEvent.locationX;
                  const percentage = x / 200;
                  const newCal = Math.round(1200 + percentage * 2300);
                  setCalories(Math.max(1200, Math.min(3500, newCal)));
                }}
              >
                <View style={[styles.sliderFill, { width: `${((calories - 1200) / 2300) * 100}%` }]} />
              </TouchableOpacity>
              <Text style={styles.sliderMax}>3500</Text>
            </View>
          </View>

          {/* 每日餐数 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>每日餐数</Text>
            <View style={styles.mealCountGrid}>
              {MEAL_COUNT_OPTIONS.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[styles.mealCountBtn, mealCount === count && styles.mealCountBtnActive]}
                  onPress={() => setMealCount(count)}
                >
                  <Text style={[styles.mealCountText, mealCount === count && styles.mealCountTextActive]}>
                    {count}餐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* 加餐开关 */}
            <View style={styles.snackToggle}>
              <Text style={styles.snackLabel}>包含加餐/点心</Text>
              <Switch
                value={includeSnack}
                onValueChange={setIncludeSnack}
                trackColor={{ false: '#E5E7EB', true: Colors.primaryLight }}
                thumbColor={includeSnack ? Colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* 饮食目标 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>饮食目标</Text>
            <View style={styles.goalGrid}>
              {HEALTH_GOALS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.goalBtn, goal === g.value && styles.goalBtnActive]}
                  onPress={() => setGoal(g.value)}
                >
                  <Ionicons name={g.icon} size={28} color={goal === g.value ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.goalLabel, goal === g.value && styles.goalLabelActive]}>
                    {g.label}
                  </Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 口味偏好 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>口味偏好（可多选）</Text>
            <View style={styles.preferencesContainer}>
              {PREFERENCE_OPTIONS.map((pref) => (
                <TouchableOpacity
                  key={pref.value}
                  style={[
                    styles.preferenceTag,
                    preferences.includes(pref.value) && styles.preferenceTagActive,
                  ]}
                  onPress={() => togglePreference(pref.value)}
                >
                  <Ionicons name={pref.icon} size={16} color={preferences.includes(pref.value) ? Colors.primary : Colors.textSecondary} />
                  <Text
                    style={[
                      styles.preferenceText,
                      preferences.includes(pref.value) && styles.preferenceTextActive,
                    ]}
                  >
                    {pref.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 高级设置 */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={styles.advancedToggleText}>高级设置</Text>
          <Ionicons
            name={showAdvanced ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.section}>
            {/* 饮食限制 */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>饮食限制/过敏</Text>
              <View style={styles.restrictionsContainer}>
                {DIETARY_RESTRICTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.restrictionTag,
                      restrictions.includes(item.value) && styles.restrictionTagActive,
                    ]}
                    onPress={() => toggleRestriction(item.value)}
                  >
                    <Text
                      style={[
                        styles.restrictionText,
                        restrictions.includes(item.value) && styles.restrictionTextActive,
                      ]}
                    >
                      {item.value}
                    </Text>
                    <Text style={styles.restrictionDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 烹饪难度 */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>烹饪难度偏好</Text>
              <View style={styles.difficultyContainer}>
                {(['简单', '中等', '复杂'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyBtn,
                      cookingDifficulty === level && styles.difficultyBtnActive,
                    ]}
                    onPress={() => setCookingDifficulty(level)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        cookingDifficulty === level && styles.difficultyTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 自定义要求 */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <Text style={styles.inputLabel}>其他要求（可选）</Text>
              <Text style={styles.inputHint}>
                例如：不喜欢吃胡萝卜、希望多安排鱼类、周末想吃得丰盛一些等
              </Text>
              <TextInput
                style={styles.customInput}
                placeholder="输入你的特殊要求..."
                value={customRequest}
                onChangeText={setCustomRequest}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* 生成按钮 */}
        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
          <Ionicons name="sparkles" size={20} color="white" style={styles.generateIcon} />
          <Text style={styles.generateBtnText}>开始生成食谱</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 热量输入弹窗 */}
      <Modal
        visible={showCalorieModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalorieModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>设置每日热量</Text>
            <Text style={styles.modalDesc}>范围：1200 - 3500 kcal</Text>
            <TextInput
              style={styles.modalInput}
              value={tempCalories}
              onChangeText={setTempCalories}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              placeholder="2000"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalBtnCancel}
                onPress={() => setShowCalorieModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnConfirm}
                onPress={confirmCalorieInput}
              >
                <Text style={styles.modalBtnConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  introCard: {
    backgroundColor: Colors.primaryLight,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  introDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
  card: {
    backgroundColor: Colors.card,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: Colors.border,
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
  mealCountGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  mealCountBtn: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  mealCountBtnActive: {
    backgroundColor: Colors.primary,
  },
  mealCountText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  mealCountTextActive: {
    color: 'white',
  },
  snackToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  snackLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  goalGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  goalBtn: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  goalBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  goalIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  goalLabelActive: {
    color: Colors.primary,
  },
  goalDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  preferenceTagActive: {
    backgroundColor: Colors.primary,
  },
  preferenceIcon: {
    fontSize: 14,
  },
  preferenceText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  preferenceTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    gap: 4,
  },
  advancedToggleText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  restrictionsContainer: {
    gap: 8,
  },
  restrictionTag: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  restrictionTagActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  restrictionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  restrictionTextActive: {
    color: Colors.danger,
  },
  restrictionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyBtn: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  difficultyBtnActive: {
    backgroundColor: Colors.primary,
  },
  difficultyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  difficultyTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  customInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  generateBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateIcon: {
    marginRight: 4,
  },
  generateBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 热量输入按钮
  calorieInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  calorieInputValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  calorieInputUnit: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 2,
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

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
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';
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
        <ScreenHeader
          title="AI 定制食谱"
          subtitle="根据身体数据、饮食目标和口味偏好，生成专属食谱"
        />

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
                <Ionicons name="pencil" size={14} color={Theme.colors.primary} style={{ marginLeft: Theme.spacing.xs }} />
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
          <View style={[styles.card, { marginTop: Theme.spacing.md }]}>
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
                trackColor={{ false: '#E5E7EB', true: Theme.colors.primaryLight }}
                thumbColor={includeSnack ? Theme.colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* 饮食目标 */}
          <View style={[styles.card, { marginTop: Theme.spacing.md }]}>
            <Text style={styles.inputLabel}>饮食目标</Text>
            <View style={styles.goalGrid}>
              {HEALTH_GOALS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.goalBtn, goal === g.value && styles.goalBtnActive]}
                  onPress={() => setGoal(g.value)}
                >
                  <Ionicons name={g.icon} size={28} color={goal === g.value ? Theme.colors.primary : Theme.colors.textSecondary} />
                  <Text style={[styles.goalLabel, goal === g.value && styles.goalLabelActive]}>
                    {g.label}
                  </Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 口味偏好 */}
          <View style={[styles.card, { marginTop: Theme.spacing.md }]}>
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
                  <Ionicons name={pref.icon} size={16} color={preferences.includes(pref.value) ? Theme.colors.primary : Theme.colors.textSecondary} />
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
            color={Theme.colors.textSecondary}
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
            <View style={[styles.card, { marginTop: Theme.spacing.md }]}>
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
            <View style={[styles.card, { marginTop: Theme.spacing.md }]}>
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
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  introCard: {
    backgroundColor: Theme.colors.primaryLight,
    margin: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.page,
    alignItems: 'center',
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.lg,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  introTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  introDesc: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  card: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginHorizontal: Theme.spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  sliderLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  sliderValue: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.warning,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderMin: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    width: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.colors.border,
    borderRadius: 3,
    marginHorizontal: Theme.spacing.sm,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Theme.colors.warning,
    borderRadius: 3,
  },
  sliderMax: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    width: 40,
    textAlign: 'right',
  },
  inputLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  mealCountGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  mealCountBtn: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
  },
  mealCountBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  mealCountText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.medium,
  },
  mealCountTextActive: {
    color: 'white',
  },
  snackToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  snackLabel: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.text,
  },
  goalGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  goalBtn: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  goalBtnActive: {
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  goalIcon: {
    fontSize: Theme.typography.sizes.h1,
    marginBottom: Theme.spacing.sm,
  },
  goalLabel: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  goalLabelActive: {
    color: Theme.colors.primary,
  },
  goalDesc: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  preferenceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cream,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.xl,
    gap: Theme.spacing.xs,
  },
  preferenceTagActive: {
    backgroundColor: Theme.colors.primary,
  },
  preferenceIcon: {
    fontSize: Theme.typography.sizes.caption,
  },
  preferenceText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  preferenceTextActive: {
    color: 'white',
    fontWeight: Theme.typography.weights.medium,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.xs,
  },
  advancedToggleText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  restrictionsContainer: {
    gap: Theme.spacing.sm,
  },
  restrictionTag: {
    backgroundColor: Theme.colors.cream,
    paddingHorizontal: Theme.spacing.content,
    paddingVertical: Theme.spacing.compact,
    borderRadius: Theme.radius.sm,
  },
  restrictionTagActive: {
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  restrictionText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
    marginBottom: Theme.spacing.xs,
  },
  restrictionTextActive: {
    color: Theme.colors.danger,
  },
  restrictionDesc: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  difficultyBtn: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.radius.sm,
    alignItems: 'center',
  },
  difficultyBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  difficultyText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  difficultyTextActive: {
    color: 'white',
    fontWeight: Theme.typography.weights.medium,
  },
  inputHint: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.sm,
  },
  customInput: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  generateBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    gap: Theme.spacing.sm,
    ...Theme.shadows.cardPressed,
  },
  generateIcon: {
    marginRight: Theme.spacing.xs,
  },
  generateBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
  },
  // 热量输入按钮
  calorieInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.xs,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  calorieInputValue: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.primary,
  },
  calorieInputUnit: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
    marginLeft: Theme.spacing.xs,
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.page,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: Theme.radius.lg,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  modalDesc: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.page,
  },
  modalInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.lg,
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.page,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: Theme.spacing.content,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.cream,
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontSize: Theme.typography.sizes.h2,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.semibold,
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: Theme.spacing.content,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    fontSize: Theme.typography.sizes.h2,
    color: 'white',
    fontWeight: Theme.typography.weights.semibold,
  },
});

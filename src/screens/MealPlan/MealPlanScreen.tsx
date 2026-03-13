import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';
import { MealPlanService, AIService } from '../../services/api';
import { MealPlan } from '../../types';

type HealthGoal = '减脂' | '增肌' | '维持';

export default function MealPlanScreen({ navigation }: any) {
  const { profile, refreshUser } = useAuth();
  
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [calories, setCalories] = useState(profile?.dailyCalorieGoal || 2000);
  const [mealCount, setMealCount] = useState(profile?.mealCount || 3);
  const [goal, setGoal] = useState<HealthGoal>(profile?.healthGoal || '维持');
  const [preferences, setPreferences] = useState<string[]>(profile?.flavorPrefs || ['清淡']);

  const preferenceOptions = ['清淡', '微辣', '无辣不欢', '少油', '低糖', '高蛋白'];

  const loadActivePlan = useCallback(async () => {
    try {
      const res = await MealPlanService.getActivePlan();
      if (res.code === 0 && res.data) {
        const plan = res.data as MealPlan & { hasPlan?: boolean };
        setHasActivePlan(plan.status === 'active');
        setActivePlan(plan.status === 'active' ? plan : null);
        
        if (plan.status === 'active') {
          setCalories(plan.calorieTarget);
          setMealCount(plan.mealCount);
          setGoal(plan.healthGoal as HealthGoal);
          setPreferences(plan.flavorPrefs || []);
        }
      }
    } catch (error) {
      console.error('加载食谱失败:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadActivePlan();
      setIsLoading(false);
    };
    init();
  }, [loadActivePlan]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadActivePlan();
    setIsRefreshing(false);
  }, [loadActivePlan]);

  const togglePreference = (pref: string) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await MealPlanService.createPlan({
        calorieTarget: calories,
        mealCount: mealCount,
        healthGoal: goal,
        flavorPrefs: preferences,
      });
      
      if (res.code === 0) {
        // 刷新用户profile以获取最新的每日热量目标
        await refreshUser();
        Alert.alert('保存成功', '您的食谱设置已保存');
        await loadActivePlan();
      } else {
        Alert.alert('保存失败', res.message || '请稍后重试');
      }
    } catch (error: any) {
      Alert.alert('保存失败', error.message || '请检查网络连接');
    } finally {
      setIsSaving(false);
    }
  }, [calories, mealCount, goal, preferences, loadActivePlan, refreshUser]);

  const handleAIGenerate = useCallback(async () => {
    setIsGeneratingAI(true);
    try {
      const res = await AIService.generateMealPlan({
        calorieTarget: calories,
        mealCount: mealCount,
        healthGoal: goal,
        flavorPrefs: preferences,
        useAI: true,
      });
      
      if (res.code === 0 && res.data) {
        // 刷新用户profile以获取最新的每日热量目标
        await refreshUser();
        Alert.alert('生成成功', 'AI已为您生成专属食谱');
        await loadActivePlan();
      } else {
        Alert.alert('生成失败', res.message || '请稍后重试');
      }
    } catch (error: any) {
      Alert.alert('生成失败', error.message || '请检查网络连接');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [calories, mealCount, goal, preferences, loadActivePlan, refreshUser]);

  const getGoalDescription = (g: HealthGoal) => {
    const descriptions: Record<HealthGoal, string> = {
      '减脂': '控制热量摄入，促进脂肪消耗',
      '增肌': '增加蛋白质摄入，支持肌肉生长',
      '维持': '保持均衡饮食，维持当前体重',
    };
    return descriptions[g];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={[styles.statusCard, hasActivePlan ? { backgroundColor: '#D1FAE5', borderColor: '#34D399' } : { backgroundColor: '#FFEDD5', borderColor: '#FED7AA' }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: hasActivePlan ? Colors.primary : Colors.warning }]}>
              <Text style={{ fontSize: 24 }}>{hasActivePlan ? '🥗' : '🥡'}</Text>
            </View>
            <View>
              <Text style={styles.statusTitle}>当前饮食计划</Text>
              <Text style={styles.statusSubtitle}>
                {hasActivePlan ? `已设置 ${activePlan?.planType === 'ai' ? 'AI生成' : '自定义'}食谱` : '未设置食谱'}
              </Text>
            </View>
          </View>
          <View style={styles.statusStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{hasActivePlan ? calories : '--'}</Text>
              <Text style={styles.statLabel}>每日摄入(kcal)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{hasActivePlan ? mealCount : '--'}</Text>
              <Text style={styles.statLabel}>每日餐数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{hasActivePlan ? goal : '--'}</Text>
              <Text style={styles.statLabel}>饮食目标</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>自定义设置</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>手动调整</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>每日摄入量</Text>
              <Text style={styles.sliderValue}>{calories} kcal</Text>
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

          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>饮食目标</Text>
            <View style={styles.segmentControl}>
              {(['减脂', '增肌', '维持'] as HealthGoal[]).map((g) => (
                <TouchableOpacity 
                  key={g}
                  style={[styles.segmentBtn, goal === g && styles.segmentBtnActive]}
                  onPress={() => setGoal(g)}
                >
                  <Text style={[styles.segmentText, goal === g && styles.segmentTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.goalDescription}>{getGoalDescription(goal)}</Text>
          </View>

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

        <TouchableOpacity 
          style={[styles.card, styles.aiCard]}
          onPress={handleAIGenerate}
          disabled={isGeneratingAI}
        >
          <View style={styles.aiCardContent}>
            <View style={[styles.aiIcon, { backgroundColor: Colors.primary }]}>
              {isGeneratingAI ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={{ fontSize: 24 }}>🤖</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiCardTitle}>
                {isGeneratingAI ? 'AI正在生成食谱...' : '智能定制食谱'}
              </Text>
              <Text style={styles.aiCardDesc}>不确定怎么设置？让AI帮您定制</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveBtnText}>💾 保存食谱设置</Text>
          )}
        </TouchableOpacity>

        {hasActivePlan && (
          <TouchableOpacity 
            style={styles.viewListBtn}
            onPress={() => navigation.navigate('MealPlanDetail', { planId: activePlan?.id })}
          >
            <Text style={styles.viewListBtnText}>📋 查看食谱详情</Text>
          </TouchableOpacity>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  statusCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
  goalDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
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
  viewListBtn: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  viewListBtnText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

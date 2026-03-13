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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';
import { MealPlanService } from '../../services/api';
import { MealPlan, MealPlanDay, Dish } from '../../types';

type HealthGoal = '减脂' | '增肌' | '维持';
type ViewMode = 'view' | 'edit';
type EditingDay = {
  dayOfWeek: number;
  mealType: string;
  dishIndex: number;
  field: 'name' | 'quantity' | 'calories';
  value: string;
};

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MEAL_TYPES: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export default function MealPlanScreen({ navigation }: any) {
  const { profile, refreshUser } = useAuth();
  
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [showMenu, setShowMenu] = useState(false);
  const [expandedDays, setExpandedDays] = useState<number[]>([]); // 默认所有天收起
  const [showCalorieInput, setShowCalorieInput] = useState(false);
  const [tempCalories, setTempCalories] = useState('');
  const [hasMenuChanges, setHasMenuChanges] = useState(false);
  
  // 编辑状态（设置）
  const [calories, setCalories] = useState(profile?.dailyCalorieGoal || 2000);
  const [mealCount, setMealCount] = useState(profile?.mealCount || 3);
  const [goal, setGoal] = useState<HealthGoal>(profile?.healthGoal || '维持');
  const [preferences, setPreferences] = useState<string[]>(profile?.flavorPrefs || ['清淡']);
  
  // 编辑状态（菜单）
  const [editedDays, setEditedDays] = useState<MealPlanDay[]>([]);

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
          // 深拷贝菜单数据用于编辑
          setEditedDays(JSON.parse(JSON.stringify(plan.days || [])));
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

  // 切换某天展开/收起
  const toggleDayExpand = (dayOfWeek: number) => {
    setExpandedDays(prev => 
      prev.includes(dayOfWeek) 
        ? prev.filter(d => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    );
  };

  // 更新菜品字段
  const updateDish = (dayOfWeek: number, mealType: string, dishIndex: number, field: keyof Dish, value: any) => {
    setEditedDays(prev => {
      const newDays = [...prev];
      const day = newDays.find(d => d.dayOfWeek === dayOfWeek);
      if (day && day.meals) {
        const meal = day.meals.find(m => m.mealType === mealType);
        if (meal && meal.dishes && meal.dishes[dishIndex]) {
          (meal.dishes[dishIndex] as any)[field] = value;
          // 重新计算该餐总热量
          meal.totalCalories = meal.dishes.reduce((sum, d) => sum + (d.calories || 0), 0);
          setHasMenuChanges(true);
        }
      }
      return newDays;
    });
  };

  const handleSave = useCallback(async () => {
    if (!activePlan?.id) return;
    
    setIsSaving(true);
    try {
      // 构建更新数据
      const updateData: any = {
        calorieTarget: calories,
        mealCount: mealCount,
        healthGoal: goal,
        flavorPrefs: preferences,
      };

      // 如果菜单有修改，一并提交
      if (hasMenuChanges) {
        updateData.updateDays = true;
        updateData.days = editedDays.flatMap(day => 
          (day.meals || []).map(meal => ({
            dayOfWeek: day.dayOfWeek,
            mealType: meal.mealType,
            dishes: meal.dishes?.map(d => ({
              name: d.name,
              quantityG: Number(d.quantity_g || d.quantityG || 100),
              calories: Number(d.calories || 0),
              proteinG: Number(d.protein_g || d.proteinG || 0),
              carbsG: Number(d.carbs_g || d.carbsG || 0),
              fatG: Number(d.fat_g || d.fatG || 0),
              cookingTip: d.cooking_tip || d.cookingTip || '',
            })),
            totalCalories: Number(meal.totalCalories || 0),
            notes: meal.notes,
          }))
        );
      }

      const res = await MealPlanService.updatePlan(activePlan.id, updateData);
      
      if (res.code === 0) {
        await refreshUser();
        Alert.alert('保存成功', hasMenuChanges ? '食谱设置和菜单已更新' : '食谱设置已更新');
        await loadActivePlan();
        setViewMode('view');
        setHasMenuChanges(false);
      } else {
        Alert.alert('保存失败', res.message || '请稍后重试');
      }
    } catch (error: any) {
      Alert.alert('保存失败', error.message || '请检查网络连接');
    } finally {
      setIsSaving(false);
    }
  }, [activePlan, calories, mealCount, goal, preferences, editedDays, hasMenuChanges, loadActivePlan, refreshUser]);

  const handleAIGenerate = useCallback(() => {
    navigation.navigate('AIGeneratePlanInput', {
      initialCalories: calories,
      initialMealCount: mealCount,
      initialGoal: goal,
      initialPreferences: preferences,
    });
  }, [calories, mealCount, goal, preferences, navigation]);

  const handleManualEdit = useCallback(() => {
    setViewMode('edit');
    // 深拷贝当前菜单用于编辑
    setEditedDays(JSON.parse(JSON.stringify(activePlan?.days || [])));
  }, [activePlan]);

  const handleCancelEdit = useCallback(() => {
    // 恢复原始值
    if (activePlan) {
      setCalories(activePlan.calorieTarget);
      setMealCount(activePlan.mealCount);
      setGoal(activePlan.healthGoal as HealthGoal);
      setPreferences(activePlan.flavorPrefs || []);
      setEditedDays(JSON.parse(JSON.stringify(activePlan.days || [])));
    }
    setViewMode('view');
    setHasMenuChanges(false);
  }, [activePlan]);

  const openCalorieInput = () => {
    setTempCalories(calories.toString());
    setShowCalorieInput(true);
  };

  const confirmCalorieInput = () => {
    const val = parseInt(tempCalories);
    if (!isNaN(val) && val >= 1200 && val <= 3500) {
      setCalories(val);
      setShowCalorieInput(false);
    } else {
      Alert.alert('输入错误', '请输入1200-3500之间的数值');
    }
  };

  const getGoalDescription = (g: HealthGoal) => {
    const descriptions: Record<HealthGoal, string> = {
      '减脂': '控制热量摄入，促进脂肪消耗',
      '增肌': '增加蛋白质摄入，支持肌肉生长',
      '维持': '保持均衡饮食，维持当前体重',
    };
    return descriptions[g];
  };

  // 获取某天的数据
  const getDayData = (dayOfWeek: number): any[] => {
    const days = viewMode === 'edit' ? editedDays : (activePlan?.days || []);
    const day = days.find(d => d.dayOfWeek === dayOfWeek);
    if (!day) return [];
    
    if (day.meals && Array.isArray(day.meals)) {
      return day.meals;
    }
    
    if (day.mealType) {
      return [{
        mealType: day.mealType,
        dishes: day.dishes || [],
        totalCalories: day.totalCalories || 0,
        notes: day.notes,
      }];
    }
    
    return [];
  };

  // 计算某天总热量
  const getDayTotalCalories = (dayOfWeek: number) => {
    const meals = getDayData(dayOfWeek);
    return meals.reduce((sum, meal) => sum + (parseFloat(meal.totalCalories) || 0), 0);
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
        {/* 状态卡片 */}
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

        {/* 设置区域 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>食谱设置</Text>
            <View style={[styles.badge, viewMode === 'edit' && styles.badgeActive]}>
              <Text style={[styles.badgeText, viewMode === 'edit' && styles.badgeTextActive]}>
                {viewMode === 'edit' ? '编辑中' : '只读'}
              </Text>
            </View>
          </View>

          {/* 每日摄入量 */}
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>每日热量目标</Text>
              {viewMode === 'edit' ? (
                <View style={styles.editableValue}>
                  <TouchableOpacity 
                    style={styles.valueAdjustBtn}
                    onPress={() => setCalories(Math.max(1200, calories - 50))}
                  >
                    <Ionicons name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.valueInput} onPress={openCalorieInput}>
                    <Text style={styles.valueText}>{calories}</Text>
                    <Text style={styles.valueUnit}>kcal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.valueAdjustBtn}
                    onPress={() => setCalories(Math.min(3500, calories + 50))}
                  >
                    <Ionicons name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.settingValue}>{calories} kcal</Text>
              )}
            </View>
          </View>

          {/* 每日餐数 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>每日餐数</Text>
              {viewMode === 'edit' ? (
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
              ) : (
                <Text style={styles.settingValue}>{mealCount}餐</Text>
              )}
            </View>
          </View>

          {/* 饮食目标 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>饮食目标</Text>
              {viewMode === 'edit' ? (
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
              ) : (
                <View style={styles.goalDisplay}>
                  <Text style={styles.settingValue}>{goal}</Text>
                  <Text style={styles.goalDescription}>{getGoalDescription(goal)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 口味偏好 */}
          <View style={[styles.card, { marginTop: 12 }]}>
            <Text style={[styles.settingLabel, { marginBottom: 12 }]}>口味偏好</Text>
            {viewMode === 'edit' ? (
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
            ) : (
              <View style={styles.preferencesDisplay}>
                {preferences.length > 0 ? preferences.map(pref => (
                  <View key={pref} style={styles.preferenceDisplayTag}>
                    <Text style={styles.preferenceDisplayText}>{pref}</Text>
                  </View>
                )) : (
                  <Text style={styles.noPreferenceText}>未设置偏好</Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* 查看每日详情按钮 */}
        {hasActivePlan && (
          <TouchableOpacity 
            style={[styles.card, styles.menuToggleCard]}
            onPress={() => setShowMenu(!showMenu)}
          >
            <View style={styles.menuToggleContent}>
              <View style={styles.menuToggleLeft}>
                <Ionicons name="restaurant-outline" size={24} color={Colors.primary} />
                <View>
                  <Text style={styles.menuToggleTitle}>查看每日菜单详情</Text>
                  <Text style={styles.menuToggleDesc}>查看或编辑一周七天详细餐食</Text>
                </View>
              </View>
              <Ionicons 
                name={showMenu ? 'chevron-up' : 'chevron-down'} 
                size={24} 
                color={Colors.textMuted} 
              />
            </View>
          </TouchableOpacity>
        )}

        {/* 每日菜单详情 */}
        {showMenu && hasActivePlan && (
          <View style={styles.menuSection}>
            <View style={styles.menuSectionHeader}>
              <Text style={styles.menuSectionTitle}>一周菜单</Text>
              {viewMode === 'edit' && (
                <Text style={styles.menuEditHint}>点击菜品可编辑</Text>
              )}
            </View>
            
            {WEEK_DAYS.map((dayName, index) => {
              const dayOfWeek = index + 1;
              const dayMeals = getDayData(dayOfWeek);
              if (dayMeals.length === 0) return null;

              const dayTotalCalories = getDayTotalCalories(dayOfWeek);
              const isExpanded = expandedDays.includes(dayOfWeek);

              return (
                <View key={dayOfWeek} style={styles.dayCard}>
                  {/* 日期标题 - 可点击展开/收起 */}
                  <TouchableOpacity 
                    style={styles.dayHeader}
                    onPress={() => toggleDayExpand(dayOfWeek)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dayHeaderLeft}>
                      <Text style={styles.dayName}>{dayName}</Text>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={18} 
                        color={Colors.textMuted}
                        style={{ marginLeft: 4 }}
                      />
                    </View>
                    <View style={styles.dayCalorieBadge}>
                      <Text style={styles.dayCalorieText}>{Math.round(dayTotalCalories)} kcal</Text>
                    </View>
                  </TouchableOpacity>

                  {/* 餐次列表 - 仅展开时显示 */}
                  {isExpanded && dayMeals.map((meal, mealIndex) => (
                    <View key={mealIndex} style={styles.mealSection}>
                      <View style={styles.mealHeader}>
                        <View style={styles.mealTitleRow}>
                          <Text style={styles.mealIcon}>
                            {meal.mealType === 'breakfast' ? '🌅' : 
                             meal.mealType === 'lunch' ? '☀️' : 
                             meal.mealType === 'dinner' ? '🌙' : '🍎'}
                          </Text>
                          <Text style={styles.mealType}>{MEAL_TYPES[meal.mealType] || meal.mealType}</Text>
                        </View>
                        <Text style={styles.mealCalories}>{Math.round(parseFloat(meal.totalCalories) || 0)} kcal</Text>
                      </View>

                      {/* 菜品列表 */}
                      {meal.dishes?.map((dish: any, dishIndex: number) => (
                        <View key={dishIndex} style={styles.dishRow}>
                          {viewMode === 'edit' ? (
                            // 编辑模式：可编辑
                            <View style={styles.dishEditRow}>
                              <TextInput
                                style={[styles.dishInput, styles.dishNameInput]}
                                value={dish.name}
                                onChangeText={(text) => updateDish(dayOfWeek, meal.mealType, dishIndex, 'name', text)}
                                placeholder="菜品名称"
                              />
                              <View style={styles.dishMetaInputs}>
                                <TextInput
                                  style={[styles.dishInput, styles.dishQuantityInput]}
                                  value={String(dish.quantity_g || dish.quantityG || '')}
                                  onChangeText={(text) => updateDish(dayOfWeek, meal.mealType, dishIndex, 'quantity_g', parseInt(text) || 0)}
                                  keyboardType="number-pad"
                                  placeholder="克"
                                />
                                <Text style={styles.dishMetaUnit}>g</Text>
                                <TextInput
                                  style={[styles.dishInput, styles.dishCalorieInput]}
                                  value={String(dish.calories || '')}
                                  onChangeText={(text) => updateDish(dayOfWeek, meal.mealType, dishIndex, 'calories', parseInt(text) || 0)}
                                  keyboardType="number-pad"
                                  placeholder="kcal"
                                />
                                <Text style={styles.dishMetaUnit}>kcal</Text>
                              </View>
                            </View>
                          ) : (
                            // 查看模式：只读
                            <View style={styles.dishViewRow}>
                              <Text style={styles.dishName}>{dish.name}</Text>
                              <View style={styles.dishMeta}>
                                <Text style={styles.dishQuantity}>{dish.quantity_g || dish.quantityG}g</Text>
                                <Text style={styles.dishCalories}>{dish.calories} kcal</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* 底部操作按钮 */}
        {viewMode === 'view' ? (
          <>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={handleManualEdit}
            >
              <Ionicons name="create-outline" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.editBtnText}>手动修改食谱</Text>
            </TouchableOpacity>

            {/* AI生成按钮 */}
            <TouchableOpacity 
              style={[styles.card, styles.aiCard]}
              onPress={handleAIGenerate}
            >
              <View style={styles.aiCardContent}>
                <View style={[styles.aiIcon, { backgroundColor: Colors.primary }]}>
                  <Text style={{ fontSize: 24 }}>🤖</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiCardTitle}>AI智能生成食谱</Text>
                  <Text style={styles.aiCardDesc}>根据您的身体数据和偏好，生成专属一周食谱</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>
                    保存{hasMenuChanges ? '设置和菜单' : '设置'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={handleCancelEdit}
              disabled={isSaving}
            >
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 卡路里输入弹窗 */}
      <Modal
        visible={showCalorieInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalorieInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>输入每日热量</Text>
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
                onPress={() => setShowCalorieInput(false)}
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: Colors.primaryLight,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  badgeTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  editableValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valueAdjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueInput: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 4,
  },
  valueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  valueUnit: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  goalDisplay: {
    alignItems: 'flex-end',
  },
  goalDescription: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
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
  preferencesDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceDisplayTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  preferenceDisplayText: {
    fontSize: 13,
    color: Colors.text,
  },
  noPreferenceText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  // AI生成卡片
  aiCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  // 菜单展开按钮
  menuToggleCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  menuToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  menuToggleDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // 菜单区域
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  menuEditHint: {
    fontSize: 12,
    color: Colors.primary,
  },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dayCalorieBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayCalorieText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  mealSection: {
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealIcon: {
    fontSize: 16,
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  mealCalories: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
  },
  dishRow: {
    marginBottom: 8,
  },
  dishViewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 10,
  },
  dishName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  dishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dishQuantity: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  dishCalories: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // 编辑模式菜品输入
  dishEditRow: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  dishInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dishNameInput: {
    width: '100%',
  },
  dishMetaInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dishQuantityInput: {
    width: 60,
    textAlign: 'center',
  },
  dishCalorieInput: {
    width: 70,
    textAlign: 'center',
  },
  dishMetaUnit: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  // 底部按钮
  editBtn: {
    margin: 16,
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editActions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
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
  cancelBtn: {
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  // 弹窗
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

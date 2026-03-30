import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { FoodService, DietService } from '../../services/api';
import { MealType, RecentFoodItem } from '../../types';

interface RecordScreenProps {
  navigation: any;
}

const MEAL_TYPES: { type: MealType; name: string; icon: string; color: string }[] = [
  { type: 'breakfast', name: '早餐', icon: '🍳', color: '#FFEDD5' },
  { type: 'lunch', name: '午餐', icon: '🍱', color: '#FEE2E2' },
  { type: 'dinner', name: '晚餐', icon: '🌙', color: '#DBEAFE' },
  { type: 'snack', name: '加餐', icon: '🍎', color: '#D1FAE5' },
];

export default function RecordScreen({ navigation }: RecordScreenProps) {
  const [recentFoods, setRecentFoods] = useState<RecentFoodItem[]>([]);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'camera' | 'voice' | 'manual' | 'quick' | null>(null);
  const [selectedFood, setSelectedFood] = useState<RecentFoodItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 每次页面获得焦点时都刷新数据
  useFocusEffect(
    useCallback(() => {
      loadRecentFoods();
    }, [])
  );

  const loadRecentFoods = async () => {
    try {
      console.log('[最近常吃] 开始加载...');
      const response = await FoodService.getRecentFoods(6);
      console.log('[最近常吃] 响应:', JSON.stringify(response, null, 2));
      if (response.code === 0 && response.data) {
        console.log('[最近常吃] 数据条数:', response.data.length);
        setRecentFoods(response.data);
      } else {
        console.warn('[最近常吃] 响应异常:', response);
      }
    } catch (error) {
      console.error('[最近常吃] 加载失败:', error);
    }
  };

  const handleMethodSelect = (method: 'camera' | 'voice' | 'manual') => {
    setSelectedMethod(method);
    setShowMealSelector(true);
  };

  const handleMealTypeSelect = (mealType: MealType) => {
    setShowMealSelector(false);
    
    switch (selectedMethod) {
      case 'camera':
        navigation.navigate('Camera', { mealType });
        break;
      case 'manual':
        navigation.navigate('FoodSearch', { mealType });
        break;
      case 'voice':
        navigation.navigate('VoiceRecord', { mealType });
        break;
      case 'quick':
        saveQuickRecord(mealType);
        break;
    }
    if (selectedMethod !== 'quick') {
      setSelectedMethod(null);
    }
  };

  const handleQuickAdd = (food: RecentFoodItem) => {
    // 快捷添加时选择餐次
    setSelectedMethod('quick');
    setSelectedFood(food);
    setShowMealSelector(true);
  };

  // 验证 UUID 格式
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // 快速保存记录（最近常吃）
  const saveQuickRecord = async (mealType: MealType) => {
    console.log('[快速添加] 开始保存, 食物:', selectedFood?.name, '餐次:', mealType);
    if (!selectedFood || isSaving) {
      console.log('[快速添加] 条件不满足, 取消保存');
      return;
    }

    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const quantity = selectedFood.defaultPortionG || 100;
      const ratio = quantity / 100;
      
      console.log('[快速添加] 计算参数:', { today, quantity, ratio, food: selectedFood });

      // 构建保存的数据项
      const item: any = {
        foodName: selectedFood.name,
        quantityG: quantity,
        calories: Math.round(selectedFood.caloriesPer100g * ratio),
        proteinG: Math.round(selectedFood.proteinPer100g * ratio * 10) / 10,
        carbsG: Math.round(selectedFood.carbsPer100g * ratio * 10) / 10,
        fatG: Math.round(selectedFood.fatPer100g * ratio * 10) / 10,
        fiberG: selectedFood.fiberPer100g ? 
          Math.round(selectedFood.fiberPer100g * ratio * 10) / 10 : 0,
        sodiumMg: selectedFood.sodiumPer100g ?
          Math.round(selectedFood.sodiumPer100g * ratio) : 0,
      };
      
      // 如果有有效的 foodItemId，也一起传
      if (selectedFood.id && isValidUUID(selectedFood.id)) {
        item.foodItemId = selectedFood.id;
      }

      console.log('[快速添加] 发送请求...');
      const response = await DietService.createRecord({
        recordDate: today,
        mealType: mealType,
        inputMethod: 'manual',
        items: [item],
      });
      console.log('[快速添加] 响应:', response);

      if (response.code === 0) {
        Alert.alert(
          '添加成功',
          `已将 ${selectedFood.name} 添加到${MEAL_TYPES.find(m => m.type === mealType)?.name}`,
          [
            { text: '继续添加', style: 'default' },
            { 
              text: '返回首页', 
              onPress: () => navigation.navigate('Main', { screen: 'HomeTab' }),
              style: 'cancel'
            },
          ]
        );
        // 刷新最近常吃列表
        loadRecentFoods();
      } else {
        throw new Error(response.message || '保存失败');
      }
    } catch (error: any) {
      console.error('[快速添加] 错误:', error);
      Alert.alert('保存失败', error.message || '请重试');
    } finally {
      setIsSaving(false);
      setSelectedFood(null);
      setSelectedMethod(null);
    }
  };

  // 格式化相对时间
  const formatRelativeTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return `${Math.floor(diffDays / 7)}周前`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>添加记录</Text>
            <Text style={styles.subtitle}>选择记录方式</Text>
          </View>
        </View>

        {/* 三种记录方式 */}
        <View style={styles.methodsContainer}>
          {/* 拍照识菜 */}
          <TouchableOpacity 
            style={styles.methodCard}
            onPress={() => handleMethodSelect('camera')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.info }]}>
              <Text style={styles.iconText}>📷</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>拍照识菜</Text>
              <Text style={styles.methodDesc}>AI识别菜品并估算热量</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* 语音速记 */}
          <TouchableOpacity 
            style={styles.methodCard}
            onPress={() => handleMethodSelect('voice')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.purple }]}>
              <Text style={styles.iconText}>🎤</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>语音速记</Text>
              <Text style={styles.methodDesc}>按住说话，自动解析食物名称</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* 手动输入 */}
          <TouchableOpacity 
            style={styles.methodCard}
            onPress={() => handleMethodSelect('manual')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
              <Text style={styles.iconText}>⌨️</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>手动输入</Text>
              <Text style={styles.methodDesc}>搜索食物库，精确记录分量</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 最近常吃 */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>最近常吃 • 点击快速添加</Text>
          <View style={styles.tagsContainer}>
            {recentFoods.length > 0 ? (
              recentFoods.map((food) => (
                <TouchableOpacity 
                  key={food.id || food.name} 
                  style={styles.foodCard}
                  onPress={() => handleQuickAdd(food)}
                  disabled={isSaving}
                >
                  <View style={styles.foodCardContent}>
                    <Text style={styles.foodCardName}>{food.name}</Text>
                    <View style={styles.foodCardMeta}>
                      {food.recordCount > 0 && (
                        <Text style={styles.foodCardCount}>吃过{food.recordCount}次</Text>
                      )}
                      {food.lastRecordedAt && (
                        <Text style={styles.foodCardTime}>
                          {formatRelativeTime(food.lastRecordedAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="add-circle" size={20} color={Colors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>暂无记录，开始添加第一餐吧！</Text>
            )}
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 餐次选择弹窗 */}
      <Modal
        visible={showMealSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMealSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择餐次</Text>
              <TouchableOpacity onPress={() => setShowMealSelector(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.mealTypeGrid}>
              {MEAL_TYPES.map((meal) => (
                <TouchableOpacity
                  key={meal.type}
                  style={[styles.mealTypeBtn, { backgroundColor: meal.color }]}
                  onPress={() => handleMealTypeSelect(meal.type)}
                >
                  <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
                  <Text style={styles.mealTypeName}>{meal.name}</Text>
                </TouchableOpacity>
              ))}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  methodsContainer: {
    padding: 16,
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  recentSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  foodCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  foodCardContent: {
    flex: 1,
  },
  foodCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  foodCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodCardCount: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  foodCardTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeBtn: {
    width: (require('react-native').Dimensions.get('window').width - 64) / 2,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  mealTypeIcon: {
    fontSize: 32,
  },
  mealTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});

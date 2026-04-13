import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';
import { FoodService, DietService, AIService } from '../../services/api';
import { FoodItem, MealType } from '../../types';

interface FoodSearchScreenProps {
  navigation: any;
  route: {
    params: {
      mealType: MealType;
    };
  };
}

const CATEGORIES = ['全部', '主食', '肉类', '蔬菜', '水果', '饮品', '其他'];

export default function FoodSearchScreen({ navigation, route }: FoodSearchScreenProps) {
  const { mealType } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);

  // 初始化加载全部食物
  useEffect(() => {
    loadFoodsByCategory();
  }, []);

  // 搜索防抖 & 分类筛选
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        // 有搜索词时进行搜索
        searchFoods();
      } else {
        // 无搜索词时，根据分类加载食物（全部分类则加载所有）
        loadFoodsByCategory();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const searchFoods = async () => {
    setIsLoading(true);
    try {
      const category = selectedCategory === '全部' ? undefined : selectedCategory;
      const response = await FoodService.searchFoods({
        q: searchQuery,
        category: category as any,
        limit: 20,
      });
      if (response.code === 0 && response.data) {
        setFoods(response.data);
      }
    } catch (error) {
      console.error('搜索食物失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 按分类加载食物
  const loadFoodsByCategory = async () => {
    setIsLoading(true);
    try {
      // 全部分类时传入 undefined，其他分类传入具体分类名
      const category = selectedCategory === '全部' ? undefined : selectedCategory;
      const response = await FoodService.getFoodsByCategory(category, 50);
      if (response.code === 0 && response.data) {
        setFoods(response.data);
      }
    } catch (error) {
      console.error('加载分类食物失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 计算实际营养值
  const calculateNutrition = useCallback((food: FoodItem, qty: number) => {
    const ratio = qty / 100;
    return {
      calories: Math.round(food.caloriesPer100g * ratio),
      protein: Math.round(food.proteinPer100g * ratio * 10) / 10,
      carbs: Math.round(food.carbsPer100g * ratio * 10) / 10,
      fat: Math.round(food.fatPer100g * ratio * 10) / 10,
    };
  }, []);

  // 保存记录
  const saveRecord = async () => {
    if (!selectedFood) return;

    try {
      const nutrition = calculateNutrition(selectedFood, quantity);
      const today = new Date().toISOString().split('T')[0];

      const response = await DietService.createRecord({
        recordDate: today,
        mealType: mealType,
        inputMethod: 'manual',
        items: [
          {
            foodItemId: selectedFood.id,
            foodName: selectedFood.name,
            quantityG: Number(quantity),
            calories: Number(nutrition.calories),
            proteinG: Number(nutrition.protein),
            carbsG: Number(nutrition.carbs),
            fatG: Number(nutrition.fat),
            fiberG: selectedFood.fiberPer100g ? 
              Math.round(Number(selectedFood.fiberPer100g) * (Number(quantity) / 100) * 10) / 10 : 0,
            sodiumMg: selectedFood.sodiumPer100g ?
              Math.round(Number(selectedFood.sodiumPer100g) * (Number(quantity) / 100)) : 0,
          },
        ],
      });

      if (response.code === 0) {
        Alert.alert('成功', '记录已保存', [
          {
            text: '继续添加',
            onPress: () => {
              setSelectedFood(null);
              setQuantity(100);
              setSearchQuery('');
            },
          },
          {
            text: '返回',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]);
      } else {
        throw new Error(response.message || '保存失败');
      }
    } catch (error: any) {
      Alert.alert('保存失败', error.message || '请重试');
    }
  };

  // 食物项渲染
  // 选择数量视图
  if (selectedFood) {
    const nutrition = calculateNutrition(selectedFood, quantity);

    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="确认份量" />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={styles.confirmContainer}
            contentContainerStyle={styles.confirmContentContainer}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.selectedFoodCard}>
              <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
              <View style={styles.selectedFoodTags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{selectedFood.category}</Text>
                </View>
              </View>
            </View>

            {/* 份量选择 */}
            <View style={styles.quantityCard}>
              <Text style={styles.sectionTitle}>份量 (克)</Text>
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <Text style={styles.quantityUnit}>g</Text>
              </View>

              {/* 快捷按钮 */}
              <View style={styles.quickQuantities}>
                {[50, 100, 150, 200, 250].map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.quickBtn, quantity === q && styles.quickBtnActive]}
                    onPress={() => setQuantity(q)}
                  >
                    <Text style={[styles.quickBtnText, quantity === q && styles.quickBtnTextActive]}>
                      {q}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 滑块 */}
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={styles.sliderBtn}
                  onPress={() => setQuantity(Math.max(10, quantity - 10))}
                >
                  <Ionicons name="remove" size={20} color={Theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${Math.min((quantity / 500) * 100, 100)}%` },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  style={styles.sliderBtn}
                  onPress={() => setQuantity(Math.min(1000, quantity + 10))}
                >
                  <Ionicons name="add" size={20} color={Theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 营养预览 */}
            <View style={styles.nutritionCard}>
              <Text style={styles.sectionTitle}>营养含量预览</Text>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                  <Text style={styles.nutritionLabel}>千卡</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                  <Text style={styles.nutritionLabel}>蛋白质</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>碳水</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                  <Text style={styles.nutritionLabel}>脂肪</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveRecord}>
              <Text style={styles.saveBtnText}>保存记录</Text>
            </TouchableOpacity>
            
            {/* 底部留白，确保可以滚动到底部 */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="搜索食物" subtitle="查找食物并添加记录" />

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* AI 智能分析入口 */}
        <TouchableOpacity
          style={styles.aiEntryRow}
          onPress={() => navigation.navigate('FoodAIInput', { mealType })}
        >
          <Ionicons name="sparkles" size={16} color={Theme.colors.primary} />
          <Text style={styles.aiEntryLabel}>AI 智能分析</Text>
          <Ionicons name="chevron-forward" size={16} color={Theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.filterCard}>
          {/* 搜索框 */}
          <View style={styles.header}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Theme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索食物..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 分类筛选 */}
          <View style={styles.categoryContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    selectedCategory === item && styles.categoryBtnActive,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === item && styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.categoryList}
            />
          </View>
        </View>

        {/* 食物库列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
        ) : foods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无食物数据</Text>
          </View>
        ) : (
          <View style={styles.foodGrid}>
            {foods.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.foodCard}
                onPress={() => {
                  setSelectedFood(item);
                  setQuantity(item.defaultPortionG || 100);
                }}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodCategory}>{item.category}</Text>
                </View>
                <View style={styles.foodCalories}>
                  <Text style={styles.calorieValue}>{item.caloriesPer100g}</Text>
                  <Text style={styles.calorieUnit}>kcal/100g</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  // AI 入口样式
  aiEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.page,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    gap: Theme.spacing.xs,
  },
  aiEntryLabel: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.primary,
  },
  filterCard: {
    backgroundColor: Theme.colors.card,
    margin: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: Theme.spacing.md,
    height: 40,
    gap: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
  },
  categoryContainer: {
    paddingTop: Theme.spacing.lg,
  },
  categoryList: {
    gap: Theme.spacing.sm,
  },
  categoryBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.card,
  },
  categoryBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  categoryText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: Theme.typography.weights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodGrid: {
    paddingTop: Theme.spacing.compact,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.compact,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
  },
  foodCategory: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  foodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  foodCount: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.radius.xs,
  },
  foodCalories: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.warning,
  },
  calorieUnit: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textMuted,
  },
  recentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  // 确认页样式
  confirmContainer: {
    flex: 1,
  },
  confirmContentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  selectedFoodCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.page,
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  selectedFoodName: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  selectedFoodTags: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  tagText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  quantityCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.page,
    marginBottom: Theme.spacing.lg,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: Theme.spacing.page,
  },
  quantityValue: {
    fontSize: 48,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
  },
  quantityUnit: {
    fontSize: Theme.typography.sizes.h2,
    color: Theme.colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  quickQuantities: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Theme.spacing.compact,
    marginBottom: Theme.spacing.page,
  },
  quickBtn: {
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.cream,
  },
  quickBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  quickBtnText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  quickBtnTextActive: {
    color: 'white',
    fontWeight: Theme.typography.weights.medium,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Theme.colors.border,
    borderRadius: 3,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Theme.colors.primary,
    borderRadius: 3,
  },
  nutritionCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.page,
    marginBottom: Theme.spacing.lg,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Theme.spacing.lg,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  nutritionLabel: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
  },

});

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
import Colors from '../../constants/Colors';
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
  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodItem}
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
  );

  // 选择数量视图
  if (selectedFood) {
    const nutrition = calculateNutrition(selectedFood, quantity);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedFood(null)}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>确认份量</Text>
          <View style={{ width: 24 }} />
        </View>

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
                  <Ionicons name="remove" size={20} color={Colors.text} />
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
                  <Ionicons name="add" size={20} color={Colors.text} />
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
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索食物..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* AI 智能分析入口 */}
      <TouchableOpacity 
        style={styles.aiEntryCard}
        onPress={() => navigation.navigate('FoodAIInput', { mealType })}
      >
        <View style={styles.aiEntryContent}>
          <View style={styles.aiEntryIcon}>
            <Ionicons name="sparkles" size={24} color={Colors.primary} />
          </View>
          <View style={styles.aiEntryText}>
            <Text style={styles.aiEntryTitle}>AI 智能分析</Text>
            <Text style={styles.aiEntryDesc}>输入食物名称，AI自动分析营养成分</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>

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

      {/* 食物库列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodItem}
          contentContainerStyle={[styles.listContainer, { flexGrow: 1, paddingBottom: 40 }]}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无食物数据</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // AI 入口样式
  aiEntryCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  aiEntryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  aiEntryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiEntryText: {
    flex: 1,
  },
  aiEntryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  aiEntryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.card,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  foodCategory: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  foodMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  foodCount: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  foodCalories: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  calorieUnit: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  recentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  // 确认页样式
  confirmContainer: {
    flex: 1,
  },
  confirmContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  selectedFoodCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedFoodName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  selectedFoodTags: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  quantityCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 20,
  },
  quantityValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  quantityUnit: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  quickQuantities: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  quickBtnActive: {
    backgroundColor: Colors.primary,
  },
  quickBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickBtnTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  nutritionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  nutritionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
});

import React, { useState, useEffect } from 'react';
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
import Colors from '../../constants/Colors';
import { FoodService } from '../../services/api';
import { FoodItem, MealType } from '../../types';

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
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'camera' | 'voice' | 'manual' | null>(null);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  const loadRecentFoods = async () => {
    try {
      const response = await FoodService.getRecentFoods(6);
      if (response.code === 0 && response.data) {
        setRecentFoods(response.data);
      }
    } catch (error) {
      console.error('加载最近食物失败:', error);
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
    }
    setSelectedMethod(null);
  };

  const handleQuickAdd = (food: FoodItem) => {
    // 快捷添加时选择餐次
    setSelectedMethod('manual');
    setShowMealSelector(true);
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
                  key={food.id} 
                  style={styles.tag}
                  onPress={() => handleQuickAdd(food)}
                >
                  <Text style={styles.tagText}>🍽️ {food.name}</Text>
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
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '500',
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

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { MealPlan } from '../../types';

interface MealPlanDetailScreenProps {
  navigation: any;
  route: {
    params: {
      mealPlan: MealPlan;
    };
  };
}

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function MealPlanDetailScreen({ navigation, route }: MealPlanDetailScreenProps) {
  const { mealPlan } = route.params;

  const getDayData = (dayOfWeek: number) => {
    return mealPlan.days?.filter(d => d.day_of_week === dayOfWeek) || [];
  };

  const getMealTypeName = (type: string) => {
    const names: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
    };
    return names[type] || type;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 计划概览 */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={[styles.planTypeBadge, 
              mealPlan.plan_type === 'ai' ? styles.aiBadge : styles.customBadge
            ]}>
              <Text style={[
                styles.planTypeText,
                mealPlan.plan_type === 'ai' ? styles.aiBadgeText : styles.customBadgeText
              ]}>
                {mealPlan.plan_type === 'ai' ? '🤖 AI生成' : '✏️ 自定义'}
              </Text>
            </View>
            <Text style={styles.planStatus}>
              {mealPlan.status === 'active' ? '进行中' : '已归档'}
            </Text>
          </View>

          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mealPlan.calorie_target}</Text>
              <Text style={styles.statLabel}>目标热量(kcal)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mealPlan.meal_count}</Text>
              <Text style={styles.statLabel}>每日餐数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mealPlan.health_goal}</Text>
              <Text style={styles.statLabel}>饮食目标</Text>
            </View>
          </View>

          {mealPlan.flavor_prefs && mealPlan.flavor_prefs.length > 0 && (
            <View style={styles.flavorContainer}>
              {mealPlan.flavor_prefs.map((pref, index) => (
                <View key={index} style={styles.flavorTag}>
                  <Text style={styles.flavorText}>{pref}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 每日食谱 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>一周食谱详情</Text>
          
          {WEEK_DAYS.map((dayName, index) => {
            const dayData = getDayData(index + 1);
            if (dayData.length === 0) return null;

            return (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{dayName}</Text>
                  <Text style={styles.dayCalories}>
                    {dayData.reduce((sum, d) => sum + (d.total_calories || 0), 0)} kcal
                  </Text>
                </View>

                {dayData.map((meal, mealIndex) => (
                  <View key={mealIndex} style={styles.mealContainer}>
                    <Text style={styles.mealType}>{getMealTypeName(meal.meal_type)}</Text>
                    
                    {meal.dishes?.map((dish, dishIndex) => (
                      <View key={dishIndex} style={styles.dishItem}>
                        <View style={styles.dishInfo}>
                          <Text style={styles.dishName}>{dish.name}</Text>
                          <Text style={styles.dishQuantity}>{dish.quantity_g}g</Text>
                        </View>
                        <Text style={styles.dishCalories}>{dish.calories} kcal</Text>
                      </View>
                    ))}

                    {meal.notes && (
                      <Text style={styles.cookingTip}>💡 {meal.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* 操作按钮 */}
        {mealPlan.status !== 'active' && (
          <TouchableOpacity style={styles.activateBtn}>
            <Text style={styles.activateBtnText}>应用此食谱</Text>
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
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: Colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiBadge: {
    backgroundColor: Colors.primaryLight,
  },
  customBadge: {
    backgroundColor: '#FEF3C7',
  },
  planTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  aiBadgeText: {
    color: Colors.primary,
  },
  customBadgeText: {
    color: '#D97706',
  },
  planStatus: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  flavorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  flavorTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flavorText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dayCalories: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  mealContainer: {
    marginBottom: 16,
  },
  mealType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dishInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dishName: {
    fontSize: 15,
    color: Colors.text,
  },
  dishQuantity: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  dishCalories: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '500',
  },
  cookingTip: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  activateBtn: {
    backgroundColor: Colors.primary,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activateBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

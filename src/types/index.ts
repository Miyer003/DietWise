// ============================================
// 用户相关类型
// ============================================

export interface User {
  id: string;
  nickname: string;
  avatarEmoji: string;
  avatarUrl?: string;  // 自定义头像URL
  phone: string;
  role: 'user' | 'admin';
}

export interface UserProfile {
  userId: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  healthGoal?: '减脂' | '增肌' | '维持';
  activityLevel?: 'sedentary' | 'lightly' | 'moderately' | 'very';
  bmr?: number;
  dailyCalorieGoal?: number;
  mealCount?: number;
  dietTags?: string[];
  allergyTags?: string[];
  flavorPrefs?: string[];
  aiPortraitTags?: string[];
  bio?: string;
}

// 成就徽章
export interface Achievement {
  badgeCode: string;
  badgeName: string;
  badgeDesc?: string;
  iconEmoji: string;
  iconColor: string;
  unlockedAt: string;
  isNew: boolean;
}

// ============================================
// 饮食记录类型
// ============================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type InputMethod = 'photo' | 'voice' | 'manual';

export interface DietRecordItem {
  id?: string;
  foodName: string;
  foodItemId?: string;
  quantityG: number;
  portionFactor?: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sodiumMg?: number;
  imageUrl?: string;
  imageHash?: string;
  aiConfidence?: number;
}

export interface DietRecord {
  id: string;
  recordDate: string;
  mealType: MealType;
  mealSeq?: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  inputMethod: InputMethod;
  notes?: string;
  items: DietRecordItem[];
  createdAt: string;
}

// ============================================
// 每日摘要与统计
// ============================================

export interface DailySummary {
  date: string;
  calorieGoal: number;
  calorieConsumed: number;
  calorieRemaining: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  healthScore: number;
  mealRecords: DietRecord[];
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  avgDailyCalories: number;
  totalDays: number;
  compliantDays: number;
  healthScore: number;
  dailyTrends: DailyTrend[];
}

export interface DailyTrend {
  date: string;
  calories: number;
  isCompliant: boolean;
}

export interface MonthlySummary {
  month: string;
  avgDailyCalories: number;
  totalDays: number;
  compliantDays: number;
  healthScore: number;
  weeklyTrends: WeeklyTrend[];
}

export interface WeeklyTrend {
  week: number;
  avgCalories: number;
}

// ============================================
// 食物库类型
// ============================================

export interface FoodItem {
  id: string;
  name: string;
  namePinyin?: string;
  nameAliases?: string[];
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sodiumPer100g?: number;
  defaultPortionG?: number;
}

export type FoodCategory = '主食' | '肉类' | '蔬菜' | '水果' | '饮品' | '其他';

// 最近常吃的食物（包含统计信息）
// id 可能为空（AI识别的自定义食物不在食物库中）
export interface RecentFoodItem {
  id?: string;
  name: string;
  namePinyin?: string;
  nameAliases?: string[];
  category: FoodCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sodiumPer100g?: number;
  defaultPortionG?: number;
  recordCount: number;
  lastRecordedAt?: string;
}

// ============================================
// 食谱规划类型
// ============================================

export interface MealPlan {
  id: string;
  planType: 'custom' | 'ai';
  calorieTarget: number;
  mealCount: number;
  healthGoal: string;
  flavorPrefs: string[];
  weekStartDate?: string;
  status: 'active' | 'archived';
  days: MealPlanDay[];
  createdAt: string;
}

// 后端返回的食谱天数据结构（嵌套 meals）
export interface MealPlanDay {
  id?: string;
  dayOfWeek: number; // 1-7
  // 后端 formatPlanResponse 返回的是嵌套结构
  meals?: MealPlanMeal[];
  // 原始数据库结构（扁平）
  mealType?: MealType;
  dishes?: Dish[];
  totalCalories?: number;
  notes?: string;
}

// 餐次结构
export interface MealPlanMeal {
  mealType: MealType;
  dishes: Dish[];
  totalCalories: number;
  notes?: string;
}

export interface Dish {
  name: string;
  quantityG?: number;        // 驼峰命名（前端使用）
  quantity_g?: number;       // 下划线命名（后端返回）
  calories: number;
  proteinG?: number;
  protein_g?: number;
  carbsG?: number;
  carbs_g?: number;
  fatG?: number;
  fat_g?: number;
  fiberG?: number;
  fiber_g?: number;
  sodiumMg?: number;
  sodium_mg?: number;
  cookingTip?: string;
  cooking_tip?: string;
}

// ============================================
// AI 相关类型
// ============================================

export interface AITip {
  id: string;
  content: string;
  type: 'ai' | 'user';
  colorTheme?: 'green' | 'blue' | 'pink' | 'orange' | 'purple';
}

export interface NutritionAnalysisResult {
  foodName: string;
  quantityG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sodiumMg?: number;
  confidence: number;
  isCached?: boolean;
}

export interface ChatSession {
  id: string;
  title?: string;
  contextSnapshot?: DailySummary;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

// ============================================
// 用户自定义提示类型
// ============================================

export interface UserTip {
  id: string;
  content: string;
  colorTheme: 'pink' | 'green' | 'blue' | 'orange' | 'purple';
  sortOrder?: number;
  displayWeight?: number;
  isActive: boolean;
}

// ============================================
// 认证相关类型
// ============================================

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  smsCode: string;
  nickname?: string;
}

export interface SmsCodeResponse {
  message: string;
  expireIn: number;
  code?: string;  // 开发环境返回
}

// ============================================
// API 响应类型
// ============================================

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  code: number;
  message: string;
  error: string;
  data: null;
}

// ============================================
// 同步相关类型
// ============================================

export interface SyncData {
  deviceId: string;
  records: DietRecord[];
  tips: UserTip[];
}

export interface SyncResult {
  successCount: number;
  conflictCount: number;
  conflicts?: Array<{
    id: string;
    serverUpdatedAt: string;
  }>;
}

// ============================================
// 反馈相关类型
// ============================================

export interface Feedback {
  id?: string;
  type: 'bug' | 'feature' | 'data_error' | 'other';
  content: string;
  contactInfo?: string;
  screenshots?: string[];
  status?: 'pending' | 'processing' | 'resolved' | 'rejected';
  adminReply?: string;
  createdAt?: string;
  resolvedAt?: string;
}

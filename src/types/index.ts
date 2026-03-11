// ============================================
// 用户相关类型
// ============================================

export interface User {
  id: string;
  nickname: string;
  avatar_emoji: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface UserProfile {
  user_id: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
  health_goal?: '减脂' | '增肌' | '维持';
  activity_level?: 'sedentary' | 'lightly' | 'moderately' | 'very';
  bmr?: number;
  daily_calorie_goal?: number;
  meal_count?: number;
  diet_tags?: string[];
  allergy_tags?: string[];
  flavor_prefs?: string[];
  ai_portrait_tags?: string[];
  bio?: string;
}

// 成就徽章
export interface Achievement {
  badge_code: string;
  badge_name: string;
  badge_desc?: string;
  icon_emoji: string;
  icon_color: string;
  unlocked_at: string;
  is_new: boolean;
}

// ============================================
// 饮食记录类型
// ============================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type InputMethod = 'photo' | 'voice' | 'manual';

export interface DietRecordItem {
  id?: string;
  food_name: string;
  food_item_id?: string;
  quantity_g: number;
  portion_factor?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sodium_mg?: number;
  image_url?: string;
  image_hash?: string;
  ai_confidence?: number;
}

export interface DietRecord {
  id: string;
  record_date: string;
  meal_type: MealType;
  meal_seq?: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  input_method: InputMethod;
  notes?: string;
  items: DietRecordItem[];
  created_at: string;
}

// ============================================
// 每日摘要与统计
// ============================================

export interface DailySummary {
  date: string;
  calorie_goal: number;
  calorie_consumed: number;
  calorie_remaining: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  health_score: number;
  meal_records: DietRecord[];
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  avg_daily_calories: number;
  total_days: number;
  compliant_days: number;
  health_score: number;
  daily_trends: DailyTrend[];
}

export interface DailyTrend {
  date: string;
  calories: number;
  is_compliant: boolean;
}

export interface MonthlySummary {
  month: string;
  avg_daily_calories: number;
  total_days: number;
  compliant_days: number;
  health_score: number;
  weekly_trends: WeeklyTrend[];
}

export interface WeeklyTrend {
  week: number;
  avg_calories: number;
}

// ============================================
// 食物库类型
// ============================================

export interface FoodItem {
  id: string;
  name: string;
  name_pinyin?: string;
  name_aliases?: string[];
  category: FoodCategory;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g?: number;
  sodium_per_100g?: number;
  default_portion_g?: number;
}

export type FoodCategory = '主食' | '肉类' | '蔬菜' | '水果' | '饮品' | '其他';

// ============================================
// 食谱规划类型
// ============================================

export interface MealPlan {
  id: string;
  plan_type: 'custom' | 'ai';
  calorie_target: number;
  meal_count: number;
  health_goal: string;
  flavor_prefs: string[];
  week_start_date?: string;
  status: 'active' | 'archived';
  days: MealPlanDay[];
  created_at: string;
}

export interface MealPlanDay {
  id: string;
  day_of_week: number; // 1-7
  meal_type: MealType;
  dishes: Dish[];
  total_calories: number;
  notes?: string;
}

export interface Dish {
  name: string;
  quantity_g: number;
  calories: number;
  cooking_tip?: string;
}

// ============================================
// AI 相关类型
// ============================================

export interface AITip {
  id: string;
  content: string;
  type: 'ai' | 'user';
  color_theme?: 'green' | 'blue' | 'pink' | 'orange' | 'purple';
}

export interface NutritionAnalysisResult {
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sodium_mg?: number;
  confidence: number;
  is_cached?: boolean;
}

export interface ChatSession {
  id: string;
  title?: string;
  context_snapshot?: DailySummary;
  message_count: number;
  last_message_at?: string;
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

// ============================================
// 提醒设置类型
// ============================================

export interface NotificationSettings {
  master_enabled: boolean;
  breakfast_enabled: boolean;
  breakfast_time: string;
  lunch_enabled: boolean;
  lunch_time: string;
  dinner_enabled: boolean;
  dinner_time: string;
  water_enabled: boolean;
  water_interval_h: number;
  water_start_time: string;
  water_end_time: string;
  record_remind: boolean;
  bedtime_remind: boolean;
  bedtime_time: string;
  expo_push_token?: string;
}

// ============================================
// 用户自定义提示类型
// ============================================

export interface UserTip {
  id: string;
  content: string;
  color_theme: 'pink' | 'green' | 'blue' | 'orange' | 'purple';
  sort_order?: number;
  display_weight?: number;
  is_active: boolean;
}

// ============================================
// 认证相关类型
// ============================================

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  sms_code: string;
  nickname?: string;
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
  device_id: string;
  records: DietRecord[];
  tips: UserTip[];
  notification_settings?: NotificationSettings;
}

export interface SyncResult {
  success_count: number;
  conflict_count: number;
  conflicts?: Array<{
    id: string;
    server_updated_at: string;
  }>;
}

// ============================================
// 反馈相关类型
// ============================================

export interface Feedback {
  id?: string;
  type: 'bug' | 'feature' | 'data_error' | 'other';
  content: string;
  contact_info?: string;
  screenshots?: string[];
  status?: 'pending' | 'processing' | 'resolved' | 'rejected';
  admin_reply?: string;
}

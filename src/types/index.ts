// 用户相关
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
  health_goal?: '减脂' | '增肌' | '维持';
  daily_calorie_goal?: number;
  meal_count?: number;
  diet_tags?: string[];
  flavor_prefs?: string[];
}

// 饮食记录（对应 diet_records 表）
export interface DietRecord {
  id: string;
  record_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_seq?: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  input_method: 'photo' | 'voice' | 'manual';
  notes?: string;
  items: DietRecordItem[];
  created_at: string;
}

export interface DietRecordItem {
  id: string;
  food_name: string;
  quantity_g: number;
  portion_factor?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sodium_mg?: number;
  image_url?: string;
  ai_confidence?: number;
}

// 每日摘要（对应 /diet/summary/daily 接口）
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

// AI建议类型
export interface AITip {
  id: string;
  content: string;
  type: 'ai' | 'user';
  color_theme?: 'green' | 'blue' | 'pink';
}
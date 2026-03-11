// API 服务统一导出
export { AuthService } from './auth.service';
export { UserService } from './user.service';
export { DietService } from './diet.service';
export { FoodService } from './food.service';
export { AIService } from './ai.service';
export { MealPlanService } from './mealPlan.service';
export { NotificationService } from './notification.service';
export { TipsService } from './tips.service';
export { FeedbackService } from './feedback.service';
export { SyncService } from './sync.service';

// 导出客户端（用于高级自定义请求）
export { default as apiClient } from './client';

import apiClient from './client';
import { ApiResponse, MealPlan } from '../../types';

export interface CreateMealPlanRequest {
  calorieTarget: number;
  mealCount: number;
  healthGoal: string;
  flavorPrefs: string[];
}

export interface UpdateMealPlanRequest {
  calorieTarget?: number;
  mealCount?: number;
  healthGoal?: string;
  flavorPrefs?: string[];
  updateDays?: boolean;
  days?: any[];
}

export const MealPlanService = {
  // 获取当前激活的食谱
  getActivePlan: async (): Promise<ApiResponse<MealPlan>> => {
    return apiClient.get('/meal-plans/active');
  },

  // 获取食谱列表
  getPlans: async (params?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiResponse<{
    plans: MealPlan[];
    cursor?: string;
    hasMore: boolean;
  }>> => {
    return apiClient.get('/meal-plans', { params });
  },

  // 获取食谱详情
  getPlanById: async (id: string): Promise<ApiResponse<MealPlan>> => {
    return apiClient.get(`/meal-plans/${id}`);
  },

  // 创建自定义食谱
  createPlan: async (data: CreateMealPlanRequest): Promise<ApiResponse<MealPlan>> => {
    return apiClient.post('/meal-plans', data);
  },

  // 更新食谱（支持部分更新）
  updatePlan: async (id: string, data: UpdateMealPlanRequest): Promise<ApiResponse<MealPlan>> => {
    return apiClient.patch(`/meal-plans/${id}`, data);
  },

  // 激活指定食谱
  activatePlan: async (id: string): Promise<ApiResponse<MealPlan>> => {
    return apiClient.patch(`/meal-plans/${id}/activate`);
  },

  // 删除食谱
  deletePlan: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/meal-plans/${id}`);
  },
};

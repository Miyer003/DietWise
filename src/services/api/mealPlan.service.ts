import apiClient from './client';
import { ApiResponse, MealPlan } from '../../types';

export interface CreateMealPlanRequest {
  calorie_target: number;
  meal_count: number;
  health_goal: string;
  flavor_prefs: string[];
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

  // 激活指定食谱
  activatePlan: async (id: string): Promise<ApiResponse<MealPlan>> => {
    return apiClient.patch(`/meal-plans/${id}/activate`);
  },

  // 删除食谱
  deletePlan: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/meal-plans/${id}`);
  },
};

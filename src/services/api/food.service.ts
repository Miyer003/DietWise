import apiClient from './client';
import { ApiResponse, FoodItem, FoodCategory, RecentFoodItem } from '../../types';

export const FoodService = {
  // 获取食物列表（支持分类筛选）
  getFoodsByCategory: async (
    category?: string,
    limit?: number
  ): Promise<ApiResponse<FoodItem[]>> => {
    return apiClient.get('/foods', { params: { category, limit: limit || 50 } });
  },

  // 搜索食物（支持中文+拼音模糊搜索）
  searchFoods: async (params: {
    q: string;
    category?: FoodCategory;
    limit?: number;
  }): Promise<ApiResponse<FoodItem[]>> => {
    return apiClient.get('/foods/search', { params });
  },

  // 获取所有分类
  getCategories: async (): Promise<ApiResponse<FoodCategory[]>> => {
    return apiClient.get('/foods/categories');
  },

  // 获取食物详情
  getFoodById: async (id: string): Promise<ApiResponse<FoodItem>> => {
    return apiClient.get(`/foods/${id}`);
  },

  // 语义检索（RAG）
  semanticSearch: async (query: string, limit?: number): Promise<ApiResponse<FoodItem[]>> => {
    return apiClient.get('/foods/semantic/search', { params: { q: query, limit } });
  },

  // 获取最近常吃的食物
  getRecentFoods: async (limit?: number): Promise<ApiResponse<RecentFoodItem[]>> => {
    return apiClient.get('/foods/recent', { params: { limit: limit || 10 } });
  },
};

import apiClient from './client';
import { ApiResponse, UserTip } from '../../types';

export interface CreateTipRequest {
  content: string;
  color_theme?: 'pink' | 'green' | 'blue' | 'orange' | 'purple';
  display_weight?: number;
}

export const TipsService = {
  // 获取所有提示
  getTips: async (): Promise<ApiResponse<UserTip[]>> => {
    return apiClient.get('/tips');
  },

  // 创建提示
  createTip: async (data: CreateTipRequest): Promise<ApiResponse<UserTip>> => {
    return apiClient.post('/tips', data);
  },

  // 更新提示
  updateTip: async (id: string, data: Partial<CreateTipRequest>): Promise<ApiResponse<UserTip>> => {
    return apiClient.patch(`/tips/${id}`, data);
  },

  // 删除提示
  deleteTip: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/tips/${id}`);
  },

  // 获取随机一条提示（首页刷新用）
  getRandomTip: async (): Promise<ApiResponse<UserTip>> => {
    return apiClient.get('/tips/random');
  },
};

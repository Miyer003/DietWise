import apiClient from './client';
import { ApiResponse, NotificationSettings } from '../../types';

export const NotificationService = {
  // 获取提醒设置
  getSettings: async (): Promise<ApiResponse<NotificationSettings>> => {
    return apiClient.get('/notifications/settings');
  },

  // 全量更新提醒设置
  updateSettings: async (data: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> => {
    return apiClient.put('/notifications/settings', data);
  },

  // 部分更新提醒设置
  patchSettings: async (data: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> => {
    return apiClient.patch('/notifications/settings', data);
  },

  // 注册 Expo Push Token
  registerPushToken: async (token: string): Promise<ApiResponse<null>> => {
    return apiClient.post('/notifications/push-token', { expoPushToken: token });
  },
};

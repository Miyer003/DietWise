import apiClient from './client';
import { ApiResponse, SyncData, SyncResult, DietRecord, MealPlan, UserProfile, NotificationSettings, Achievement } from '../../types';

export interface PullResponse {
  diet_records: DietRecord[];
  meal_plans: MealPlan[];
  user_profile: UserProfile | null;
  notification_settings: NotificationSettings | null;
  achievements: Achievement[];
  server_time: string;
}

export const SyncService = {
  // 推送离线数据到云端
  push: async (data: SyncData): Promise<ApiResponse<SyncResult>> => {
    return apiClient.post('/sync/push', data);
  },

  // 拉取云端最新数据
  pull: async (params: {
    last_sync_at: string;
    device_id: string;
  }): Promise<ApiResponse<PullResponse>> => {
    return apiClient.get('/sync/pull', { params });
  },
};

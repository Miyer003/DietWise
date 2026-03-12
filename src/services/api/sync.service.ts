import apiClient from './client';
import { ApiResponse, SyncData, SyncResult, DietRecord, MealPlan, UserProfile, NotificationSettings, Achievement } from '../../types';

export interface PullResponse {
  dietRecords: DietRecord[];
  mealPlans: MealPlan[];
  userProfile: UserProfile | null;
  notificationSettings: NotificationSettings | null;
  achievements: Achievement[];
  serverTime: string;
}

export const SyncService = {
  // 推送离线数据到云端
  push: async (data: SyncData): Promise<ApiResponse<SyncResult>> => {
    return apiClient.post('/sync/push', data);
  },

  // 拉取云端最新数据
  pull: async (params: {
    lastSyncAt: string;
    deviceId: string;
  }): Promise<ApiResponse<PullResponse>> => {
    return apiClient.get('/sync/pull', { params });
  },
};

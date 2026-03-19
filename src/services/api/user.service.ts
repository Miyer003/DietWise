import apiClient from './client';
import { ApiResponse, User, UserProfile, Achievement } from '../../types';

export const UserService = {
  // 获取当前用户信息
  getMe: async (): Promise<ApiResponse<User>> => {
    return apiClient.get('/users/me');
  },

  // 更新用户信息
  updateMe: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.patch('/users/me', data);
  },

  // 获取用户画像
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    return apiClient.get('/users/me/profile');
  },

  // 全量更新用户画像
  updateProfile: async (data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    return apiClient.put('/users/me/profile', data);
  },

  // 部分更新用户画像
  patchProfile: async (data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    return apiClient.patch('/users/me/profile', data);
  },

  // 获取用户统计
  getStats: async (): Promise<ApiResponse<{
    streakDays: number;
    totalRecords: number;
    joinDays: number;
    joinDate: string;
  }>> => {
    return apiClient.get('/users/me/stats');
  },

  // 获取成就徽章列表
  getAchievements: async (status?: 'all' | 'new'): Promise<ApiResponse<{
    total: number;
    achievements: Achievement[];
  }>> => {
    return apiClient.get('/users/me/achievements', {
      params: { status: status || 'all' },
    });
  },

  // 获取新解锁成就
  getNewAchievements: async (): Promise<ApiResponse<{
    total: number;
    achievements: Achievement[];
  }>> => {
    return apiClient.get('/users/me/achievements/new');
  },

  // 标记成就为已读
  markAchievementsRead: async (): Promise<ApiResponse<null>> => {
    return apiClient.patch('/users/me/achievements/read');
  },

  // 注销账号
  deleteAccount: async (): Promise<ApiResponse<null>> => {
    return apiClient.delete('/users/me');
  },

  // 获取头像上传预签名URL
  getAvatarUploadUrl: async (filename: string): Promise<ApiResponse<{
    uploadUrl: string;
    objectName: string;
    avatarUrl: string;
  }>> => {
    return apiClient.post('/users/me/avatar/upload-url', null, {
      params: { filename },
    });
  },
};

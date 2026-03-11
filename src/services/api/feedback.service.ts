import apiClient from './client';
import { ApiResponse, Feedback } from '../../types';

export const FeedbackService = {
  // 提交反馈
  submitFeedback: async (data: Omit<Feedback, 'id' | 'status'>): Promise<ApiResponse<Feedback>> => {
    return apiClient.post('/feedback', data);
  },

  // 获取我的反馈列表
  getMyFeedbacks: async (): Promise<ApiResponse<Feedback[]>> => {
    return apiClient.get('/feedback/my');
  },
};

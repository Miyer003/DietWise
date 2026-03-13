import apiClient from './client';
import { 
  ApiResponse, 
  DietRecord, 
  DietRecordItem, 
  DailySummary, 
  WeeklySummary, 
  MonthlySummary,
  MealType,
  InputMethod 
} from '../../types';

export interface CreateDietRecordRequest {
  recordDate: string;
  mealType: MealType;
  inputMethod: InputMethod;
  notes?: string;
  items: Omit<DietRecordItem, 'id'>[];
}

export interface UpdateDietRecordRequest {
  notes?: string;
  items?: DietRecordItem[];
}

export const DietService = {
  // 查询记录列表
  getRecords: async (params?: {
    date?: string;
    mealType?: MealType;
    cursor?: string;
    limit?: number;
  }): Promise<ApiResponse<{ 
    records: DietRecord[]; 
    cursor?: string; 
    hasMore: boolean;
  }>> => {
    return apiClient.get('/diet/records', { params });
  },

  // 获取单条记录详情
  getRecordById: async (id: string): Promise<ApiResponse<DietRecord>> => {
    return apiClient.get(`/diet/records/${id}`);
  },

  // 创建记录
  createRecord: async (data: CreateDietRecordRequest): Promise<ApiResponse<DietRecord>> => {
    return apiClient.post('/diet/records', data);
  },

  // 更新记录
  updateRecord: async (id: string, data: UpdateDietRecordRequest): Promise<ApiResponse<DietRecord>> => {
    return apiClient.patch(`/diet/records/${id}`, data);
  },

  // 删除记录
  deleteRecord: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('[DietService] 删除记录请求开始, id:', id);
    return apiClient.delete(`/diet/records/${id}`);
  },

  // 获取每日摘要
  getDailySummary: async (date: string): Promise<ApiResponse<DailySummary>> => {
    return apiClient.get('/diet/summary/daily', { params: { date } });
  },

  // 获取每周摘要
  getWeeklySummary: async (weekStart: string): Promise<ApiResponse<WeeklySummary>> => {
    return apiClient.get('/diet/summary/weekly', { params: { weekStart } });
  },

  // 获取每月摘要
  getMonthlySummary: async (month: string): Promise<ApiResponse<MonthlySummary>> => {
    return apiClient.get('/diet/summary/monthly', { params: { month } });
  },

  // 获取图片上传URL
  getUploadUrl: async (filename: string): Promise<ApiResponse<{
    uploadUrl: string;
    objectName: string;
  }>> => {
    return apiClient.post('/diet/upload-image', {}, { params: { filename } });
  },

  // 获取有记录的所有日期列表
  getDatesWithRecords: async (limit?: number): Promise<ApiResponse<{
    dates: { date: string; hasRecord: boolean }[];
  }>> => {
    return apiClient.get('/diet/history/dates', { params: { limit } });
  },

  // 获取有记录的所有周列表
  getWeeksWithRecords: async (limit?: number): Promise<ApiResponse<{
    weeks: { weekStart: string; weekEnd: string; hasRecord: boolean; recordCount: number }[];
  }>> => {
    return apiClient.get('/diet/history/weeks', { params: { limit } });
  },

  // 获取有记录的所有月列表
  getMonthsWithRecords: async (limit?: number): Promise<ApiResponse<{
    months: { month: string; label: string; hasRecord: boolean }[];
  }>> => {
    return apiClient.get('/diet/history/months', { params: { limit } });
  },
};

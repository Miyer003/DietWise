import apiClient from './client';
import { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, User } from '../../types';

export const AuthService = {
  // 账号密码登录
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post('/auth/login', data);
  },

  // 手机号验证码登录
  loginBySms: async (phone: string, smsCode: string): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post('/auth/verify-sms', { phone, sms_code: smsCode });
  },

  // 发送短信验证码
  sendSmsCode: async (phone: string): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/send-sms-code', { phone });
  },

  // 注册
  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    return apiClient.post('/auth/register', data);
  },

  // 刷新 Token
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> => {
    return apiClient.post('/auth/refresh', { refresh_token: refreshToken });
  },

  // 登出
  logout: async (): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/logout');
  },
};

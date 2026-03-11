import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.dietwise.cn/v1';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 获取存储的 token
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('access_token');
  } catch {
    return null;
  }
};

// 刷新 token
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    if (response.data?.code === 0 && response.data?.data) {
      const { access_token, refresh_token } = response.data.data;
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);
      return access_token;
    }
    return null;
  } catch {
    return null;
  }
};

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 处理 401 错误，尝试刷新 token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } else {
        // 刷新失败，清除登录状态
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
        // 可以在这里触发全局登录过期事件
      }
    }

    // 统一错误处理
    const errorData = (error.response?.data as any) || {};
    const errorMessage = errorData.message || '请求失败，请稍后重试';
    
    return Promise.reject({
      message: errorMessage,
      code: errorData.code || error.response?.status || 500,
      error: errorData.error || 'UNKNOWN_ERROR',
    });
  }
);

export default apiClient;

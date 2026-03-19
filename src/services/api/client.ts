import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 开发环境配置
// 方式1: USB调试 + adb reverse: http://localhost:3000/v1
// 方式2: 局域网调试（手机开热点）: http://192.168.x.x:3000/v1 （电脑的局域网IP）
const DEV_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/v1';
console.log('API URL:', DEV_API_URL);

// 生产环境地址
const PROD_API_URL = 'https://api.dietwise.cn/v1';

// 自动判断：__DEV__ 是 React Native 内置变量，开发时为 true
const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

console.log('📡 API Base URL:', API_BASE_URL);

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
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
      refreshToken: refreshToken,
    });

    if (response.data?.code === 0 && response.data?.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', newRefreshToken);
      return accessToken;
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } else {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
      }
    }

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

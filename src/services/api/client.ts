import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 开发环境使用本地后端，生产环境使用线上地址
// 
// 手机调试有两种方式：
// 1. 使用局域网 IP: 手机和电脑在同一WiFi下，使用电脑的局域网 IP
//    获取本机 IP: macOS: ifconfig | grep "inet "  Windows: ipconfig
//
// 2. 使用 adb reverse: 运行 adb reverse tcp:3000 tcp:3000
//    然后使用 localhost，手机会通过 USB 连接访问电脑
//
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/v1'  // 🔌 USB 连接：使用 localhost（需要 adb reverse）
  : 'https://api.dietwise.cn/v1';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,  // 默认120秒，AI生成食谱可能需要较长时间
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
    
    // 记录错误日志（开发环境）
    if (__DEV__) {
      console.error('API Error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        message: errorMessage,
        data: errorData,
      });
    }
    
    return Promise.reject({
      message: errorMessage,
      code: errorData.code || error.response?.status || 500,
      error: errorData.error || 'UNKNOWN_ERROR',
    });
  }
);

export default apiClient;

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserProfile, LoginResponse } from '../types';
import { AuthService, UserService } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  loginBySms: (phone: string, smsCode: string) => Promise<void>;
  register: (data: {
    phone: string;
    password: string;
    sms_code: string;
    nickname?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';
const USER_PROFILE_KEY = 'user_profile';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 初始化：检查本地存储的登录状态
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, userData, profileData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
        AsyncStorage.getItem(USER_PROFILE_KEY),
      ]);

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        if (profileData) {
          setProfile(JSON.parse(profileData));
        }

        // 验证token是否有效，同时刷新用户数据
        await refreshUser();
      }
    } catch (error) {
      console.error('加载登录状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理登录响应
  const handleLoginResponse = async (response: { data: LoginResponse }) => {
    const { access_token, refresh_token, user } = response.data;
    
    // 保存到本地存储
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, access_token],
      [REFRESH_TOKEN_KEY, refresh_token],
      [USER_DATA_KEY, JSON.stringify(user)],
    ]);

    setUser(user);
    setIsAuthenticated(true);

    // 获取用户画像
    try {
      const profileRes = await UserService.getProfile();
      if (profileRes.code === 0 && profileRes.data) {
        setProfile(profileRes.data);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileRes.data));
      }
    } catch (error) {
      console.error('获取用户画像失败:', error);
    }
  };

  // 账号密码登录
  const login = useCallback(async (phone: string, password: string) => {
    try {
      const response = await AuthService.login({ phone, password });
      if (response.code === 0) {
        await handleLoginResponse(response as any);
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error: any) {
      throw new Error(error.message || '登录失败，请检查网络连接');
    }
  }, []);

  // 短信验证码登录
  const loginBySms = useCallback(async (phone: string, smsCode: string) => {
    try {
      const response = await AuthService.loginBySms(phone, smsCode);
      if (response.code === 0) {
        await handleLoginResponse(response as any);
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error: any) {
      throw new Error(error.message || '登录失败，请检查网络连接');
    }
  }, []);

  // 注册
  const register = useCallback(async (data: {
    phone: string;
    password: string;
    sms_code: string;
    nickname?: string;
  }) => {
    try {
      const response = await AuthService.register(data);
      if (response.code === 0) {
        await handleLoginResponse(response as any);
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error: any) {
      throw new Error(error.message || '注册失败，请检查网络连接');
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      // 调用后端登出接口
      await AuthService.logout().catch(() => {});
    } finally {
      // 清除本地存储
      await AsyncStorage.multiRemove([
        AUTH_TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        USER_DATA_KEY,
        USER_PROFILE_KEY,
      ]);
      
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
  }, []);

  // 刷新用户数据
  const refreshUser = useCallback(async () => {
    try {
      const [userRes, profileRes] = await Promise.all([
        UserService.getMe(),
        UserService.getProfile(),
      ]);

      if (userRes.code === 0 && userRes.data) {
        setUser(userRes.data);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userRes.data));
      }

      if (profileRes.code === 0 && profileRes.data) {
        setProfile(profileRes.data);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileRes.data));
      }
    } catch (error) {
      console.error('刷新用户数据失败:', error);
      // 如果token失效，登出
      if ((error as any)?.code === 40100 || (error as any)?.code === 40101) {
        await logout();
      }
    }
  }, [logout]);

  // 更新用户画像
  const updateProfile = useCallback(async (newProfile: Partial<UserProfile>) => {
    try {
      const response = await UserService.patchProfile(newProfile);
      if (response.code === 0 && response.data) {
        const updatedProfile = response.data;
        setProfile(updatedProfile);
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      } else {
        throw new Error(response.message || '更新失败');
      }
    } catch (error: any) {
      throw new Error(error.message || '更新失败，请检查网络连接');
    }
  }, []);

  // 更新用户信息
  const updateUser = useCallback(async (newUser: Partial<User>) => {
    try {
      const response = await UserService.updateMe(newUser);
      if (response.code === 0 && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      } else {
        throw new Error(response.message || '更新失败');
      }
    } catch (error: any) {
      throw new Error(error.message || '更新失败，请检查网络连接');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      isAuthenticated,
      login,
      loginBySms,
      register,
      logout,
      refreshUser,
      updateProfile,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

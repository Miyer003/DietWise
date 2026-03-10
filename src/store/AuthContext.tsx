import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // 模拟已登录用户（开发阶段）
      const mockUser: User = {
        id: '12345678',
        nickname: 'User',
        avatar_emoji: '😊',
        phone: '13800138000',
        role: 'user',
      };
      const mockProfile: UserProfile = {
        user_id: '12345678',
        daily_calorie_goal: 2000,
        meal_count: 3,
        health_goal: '减脂',
      };
      
      setUser(mockUser);
      setProfile(mockProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };


  const logout = async () => {
    await AsyncStorage.clear(); // 或者逐个删除
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (newProfile: UserProfile) => {
    await AsyncStorage.setItem('user_profile', JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
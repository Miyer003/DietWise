import apiClient from './client';
import { 
  ApiResponse, 
  NutritionAnalysisResult, 
  ChatSession, 
  ChatMessage,
  AITip,
  MealPlan 
} from '../../types';

export interface AnalyzeNutritionRequest {
  type: 'image' | 'text';
  image_url?: string;
  image_hash?: string;
  description?: string;
  quantity_g?: number;
}

export interface ChatRequest {
  session_id?: string;
  message: string;
  include_context?: boolean;
}

export interface GenerateMealPlanRequest {
  calorie_target: number;
  meal_count: number;
  health_goal: string;
  flavor_prefs: string[];
  use_ai?: boolean;
}

export const AIService = {
  // 营养分析
  analyzeNutrition: async (data: AnalyzeNutritionRequest): Promise<ApiResponse<NutritionAnalysisResult>> => {
    return apiClient.post('/ai/analyze-nutrition', data);
  },

  // AI对话（非流式）
  chat: async (data: ChatRequest): Promise<ApiResponse<{ 
    session_id: string; 
    content: string;
    message_count: number;
  }>> => {
    return apiClient.post('/ai/chat', data);
  },

  // AI对话（流式）- 使用 EventSource
  chatStream: (data: ChatRequest, callbacks: {
    onMessage: (content: string) => void;
    onComplete: () => void;
    onError: (error: any) => void;
  }) => {
    // 流式请求需要特殊处理，这里提供基础实现
    const eventSource = new EventSource(
      `${apiClient.defaults.baseURL}/ai/chat?session_id=${data.session_id || ''}&message=${encodeURIComponent(data.message)}`,
      { withCredentials: true }
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'delta') {
        callbacks.onMessage(data.content);
      } else if (data.type === 'done') {
        callbacks.onComplete();
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      callbacks.onError(error);
      eventSource.close();
    };

    return eventSource;
  },

  // 获取会话列表
  getChatSessions: async (): Promise<ApiResponse<ChatSession[]>> => {
    return apiClient.get('/ai/chat/sessions');
  },

  // 获取会话消息历史
  getChatSession: async (id: string): Promise<ApiResponse<{
    session: ChatSession;
    messages: ChatMessage[];
  }>> => {
    return apiClient.get(`/ai/chat/sessions/${id}`);
  },

  // 删除会话
  deleteChatSession: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete(`/ai/chat/sessions/${id}`);
  },

  // 生成食谱
  generateMealPlan: async (data: GenerateMealPlanRequest): Promise<ApiResponse<MealPlan>> => {
    return apiClient.post('/ai/generate-plan', data);
  },

  // 生成今日AI健康建议
  generateTip: async (): Promise<ApiResponse<AITip>> => {
    return apiClient.post('/ai/generate-tip');
  },

  // 获取AI使用统计
  getUsage: async (): Promise<ApiResponse<{
    month: string;
    call_count: number;
    cost_yuan: number;
  }>> => {
    return apiClient.get('/ai/usage/me');
  },
};

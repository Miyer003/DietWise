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
  type: 'image' | 'text' | 'voice';
  imageUrl?: string;
  imageBase64?: string;  // 新增：支持 base64 图片
  imageHash?: string;
  description?: string;
  quantityG?: number;
}

export interface AnalyzeVoiceRequest {
  audioBase64: string;
  mimeType?: string;
}

export interface AnalyzeVoiceResponse {
  transcribedText: string;
  analysisResult: NutritionAnalysisResult;
  isGuessed?: boolean;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  includeContext?: boolean;
}

export interface GenerateMealPlanRequest {
  calorieTarget: number;
  mealCount: number;
  healthGoal: string;
  flavorPrefs: string[];
  useAI?: boolean;
  heightCm?: number;
  weightKg?: number;
  // 高级设置
  restrictions?: string[];
  customRequest?: string;
  cookingDifficulty?: string;
}

export const AIService = {
  // 营养分析
  analyzeNutrition: async (data: AnalyzeNutritionRequest): Promise<ApiResponse<NutritionAnalysisResult>> => {
    return apiClient.post('/ai/analyze-nutrition', data);
  },

  // 语音分析（语音识别 + 营养分析）
  analyzeVoice: async (data: AnalyzeVoiceRequest): Promise<ApiResponse<AnalyzeVoiceResponse>> => {
    return apiClient.post('/ai/analyze-voice', data, { timeout: 30000 });
  },

  // AI对话（非流式）
  chat: async (data: ChatRequest): Promise<ApiResponse<{ 
    sessionId: string; 
    content: string;
    messageCount: number;
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
      `${apiClient.defaults.baseURL}/ai/chat?sessionId=${data.sessionId || ''}&message=${encodeURIComponent(data.message)}`,
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

  // 生成食谱（超时时间设置为120秒，因为AI生成可能需要较长时间）
  generateMealPlan: async (data: GenerateMealPlanRequest): Promise<ApiResponse<MealPlan>> => {
    return apiClient.post('/ai/generate-plan', data, { timeout: 120000 });
  },

  // 生成今日AI健康建议
  generateTip: async (): Promise<ApiResponse<AITip>> => {
    return apiClient.post('/ai/generate-tip');
  },

  // 获取AI使用统计
  getUsage: async (): Promise<ApiResponse<{
    month: string;
    callCount: number;
    costYuan: number;
  }>> => {
    return apiClient.get('/ai/usage/me');
  },
};

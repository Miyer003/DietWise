import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';
import { DietService, AIService } from '../../services/api';
import { DailySummary } from '../../types';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Markdown 样式配置
const markdownStyles = {
  body: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginVertical: 4,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  heading1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 8,
  },
  heading2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 6,
  },
  heading3: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 4,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
    paddingLeft: 8,
  },
  strong: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  em: {
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  code_inline: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    color: Colors.danger,
  },
  code_block: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  fence: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingLeft: 12,
    marginVertical: 8,
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 8,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginVertical: 8,
  },
  thead: {
    backgroundColor: '#F3F4F6',
  },
  th: {
    padding: 8,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  td: {
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  hr: {
    backgroundColor: '#E5E7EB',
    height: 1,
    marginVertical: 12,
  },
};

// 用户消息样式（右侧）
const userMarkdownStyles = {
  ...markdownStyles,
  body: {
    ...markdownStyles.body,
    color: 'white',
  },
  paragraph: {
    ...markdownStyles.paragraph,
    color: 'white',
  },
  strong: {
    ...markdownStyles.strong,
    color: 'white',
  },
  heading1: {
    ...markdownStyles.heading1,
    color: 'white',
  },
  heading2: {
    ...markdownStyles.heading2,
    color: 'white',
  },
  heading3: {
    ...markdownStyles.heading3,
    color: 'white',
  },
};

const ChatScreen: React.FC = ({ route }: any) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const initialMessageSent = useRef(false);

  const quickQuestions = [
    '今天还能吃多少？',
    '推荐今晚晚餐',
    '分析本周趋势',
    '孕妇能吃什么？',
  ];

  // 处理从其他页面传入的初始消息
  useEffect(() => {
    if (route.params?.initialMessage && !initialMessageSent.current) {
      initialMessageSent.current = true;
      // 延迟一点发送，确保欢迎消息已经显示
      setTimeout(() => {
        handleSend(route.params.initialMessage);
      }, 500);
    }
  }, [route.params]);

  // 加载今日数据
  useEffect(() => {
    const loadDailyData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await DietService.getDailySummary(today);
        if (res.code === 0 && res.data) {
          setDailySummary(res.data);
        }
      } catch (error) {
        console.error('加载每日数据失败:', error);
      }
    };
    loadDailyData();
  }, []);

  // 添加欢迎消息
  useEffect(() => {
    if (dailySummary && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 您好${user?.nickname ? '，' + user.nickname : ''}！我是您的AI营养顾问\n\n我已同步您今日的饮食记录。今日已摄入 **${Math.round(dailySummary.calorieConsumed)}** kcal，剩余 **${Math.round(dailySummary.calorieRemaining)}** kcal。有什么可以帮您？`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [dailySummary, user]);

  // 自动滚动到底部
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 调用 AI 对话 API
      const res = await AIService.chat({
        message: text.trim(),
        includeContext: true,
      });

      if (res.code === 0 && res.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.data.content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(res.message || 'AI 回复失败');
      }
    } catch (error: any) {
      console.error('AI 对话失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我暂时无法回答您的问题。请稍后再试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 顶部数据快照 */}
      <View style={styles.snapshot}>
        <View style={styles.snapshotContent}>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotValue}>
              {dailySummary ? Math.round(dailySummary.calorieConsumed).toLocaleString() : '--'}
            </Text>
            <Text style={styles.snapshotLabel}>已摄入</Text>
          </View>
          <View style={styles.snapshotItem}>
            <Text style={[styles.snapshotValue, { color: Colors.success }]}>
              {dailySummary ? Math.round(dailySummary.calorieRemaining).toLocaleString() : '--'}
            </Text>
            <Text style={styles.snapshotLabel}>剩余额度</Text>
          </View>
          <View style={styles.snapshotItem}>
            <Text style={[styles.snapshotValue, { color: Colors.warning }]}>
              {dailySummary ? dailySummary.mealRecords?.length || 0 : '--'}
            </Text>
            <Text style={styles.snapshotLabel}>餐次记录</Text>
          </View>
        </View>
      </View>

      {/* 聊天区域 */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message, index) => (
          <View key={message.id}>
            {message.role === 'assistant' ? (
              <View style={styles.messageLeft}>
                <Markdown style={markdownStyles}>
                  {message.content}
                </Markdown>
                <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
              </View>
            ) : (
              <View style={styles.messageRight}>
                <Markdown style={userMarkdownStyles}>
                  {message.content}
                </Markdown>
                <Text style={[styles.messageTime, { color: 'rgba(255,255,255,0.7)', alignSelf: 'flex-end' }]}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            )}
          </View>
        ))}
        
        {/* 快捷问题（只在开始时显示） */}
        {messages.length <= 1 && (
          <View style={styles.quickQuestions}>
            {quickQuestions.map((q, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.quickQuestionBtn}
                onPress={() => handleQuickQuestion(q)}
              >
                <Text style={styles.quickQuestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>AI 思考中...</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部输入框 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput 
            style={styles.input}
            placeholder="输入您的饮食问题..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  snapshot: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  snapshotContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  snapshotItem: {
    alignItems: 'center',
  },
  snapshotValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  snapshotLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  chatContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageLeft: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: width * 0.85,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  messageRight: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
    maxWidth: width * 0.85,
    marginBottom: 12,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  quickQuestionBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickQuestionText: {
    fontSize: 13,
    color: Colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textMuted,
  },
});

export default ChatScreen;

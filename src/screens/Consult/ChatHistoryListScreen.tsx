import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { Theme } from '../../constants/Theme';
import { AIService } from '../../services/api';
import { ChatSession } from '../../types';

interface ChatHistoryListScreenProps {
  navigation: any;
}

export default function ChatHistoryListScreen({ navigation }: ChatHistoryListScreenProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const res = await AIService.getChatSessions();
      if (res.code === 0 && res.data) {
        // 后端返回的是 { total, page, limit, items }
        const items = (res.data as any).items || res.data || [];
        setSessions(items);
      }
    } catch (error) {
      console.error('加载历史会话失败:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadSessions();
      setIsLoading(false);
    };
    init();
  }, [loadSessions]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSessions();
    setIsRefreshing(false);
  }, [loadSessions]);

  const handleDelete = useCallback((session: ChatSession) => {
    Alert.alert(
      '删除会话',
      `确定要删除「${session.title || '未命名会话'}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await AIService.deleteChatSession(session.id);
              setSessions(prev => prev.filter(s => s.id !== session.id));
            } catch (error) {
              Alert.alert('删除失败', '请稍后重试');
            }
          },
        },
      ]
    );
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="历史对话" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="历史对话" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* 新建会话按钮 */}
        <TouchableOpacity
          style={styles.newSessionBtn}
          onPress={() => navigation.navigate('Chat')}
        >
          <Ionicons name="add-circle" size={24} color={Theme.colors.primary} />
          <Text style={styles.newSessionText}>开始新对话</Text>
        </TouchableOpacity>

        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>暂无历史对话</Text>
            <Text style={styles.emptyDesc}>点击上方开始新对话</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listHint}>共 {sessions.length} 个历史对话</Text>
            {sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => navigation.navigate('Chat', { sessionId: session.id })}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.sessionTitle} numberOfLines={1}>
                    {session.title || '未命名会话'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(session)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={Theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText}>
                      <Ionicons name="chatbubble-outline" size={14} color={Theme.colors.textSecondary} /> {' '}
                      {session.messageCount || 0} 条消息
                    </Text>
                    <Text style={styles.infoText}>
                      <Ionicons name="time-outline" size={14} color={Theme.colors.textSecondary} /> {' '}
                      {formatDate(session.lastMessageAt || session.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.compact,
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  newSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.card,
    marginHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.compact,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    gap: Theme.spacing.sm,
  },
  newSessionText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  emptyDesc: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  listContainer: {
    padding: Theme.spacing.lg,
  },
  listHint: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.compact,
  },
  sessionCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.compact,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  sessionTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  cardBody: {
    marginTop: Theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textSecondary,
  },
});

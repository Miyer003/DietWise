import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FeedbackService } from '../../services/api';
import { Feedback } from '../../types';

// 反馈类型映射
const FEEDBACK_TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  bug: { label: '问题反馈', icon: 'bug', color: '#EF4444' },
  feature: { label: '功能建议', icon: 'bulb', color: '#F59E0B' },
  data_error: { label: '数据错误', icon: 'warning', color: '#3B82F6' },
  other: { label: '其他', icon: 'chatbubbles', color: '#10B981' },
};

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: '#F59E0B', bgColor: '#FEF3C7' },
  processing: { label: '处理中', color: '#3B82F6', bgColor: '#DBEAFE' },
  resolved: { label: '已解决', color: '#10B981', bgColor: '#D1FAE5' },
  rejected: { label: '已关闭', color: '#6B7280', bgColor: '#F3F4F6' },
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  // 后端返回格式: 2026-03-26 01:34:22 或 ISO 格式
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    return dateStr.slice(0, 16).replace(' ', '\n');
  }
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(' ', '\n');
  } catch {
    return dateStr;
  }
};

interface FeedbackCardProps {
  feedback: Feedback;
  isExpanded: boolean;
  onToggle: () => void;
}

// 单个反馈卡片组件
function FeedbackCard({ feedback, isExpanded, onToggle }: FeedbackCardProps) {
  const typeInfo = FEEDBACK_TYPE_MAP[feedback.type] || FEEDBACK_TYPE_MAP.other;
  const statusInfo = STATUS_MAP[feedback.status || 'pending'];
  const hasReply = !!feedback.adminReply;

  return (
    <TouchableOpacity
      style={[styles.card, isExpanded && styles.cardExpanded]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      {/* 头部：类型和状态 */}
      <View style={styles.cardHeader}>
        <View style={[styles.typeTag, { backgroundColor: typeInfo.color + '20' }]}>
          <Ionicons name={typeInfo.icon as any} size={14} color={typeInfo.color} />
          <Text style={[styles.typeText, { color: typeInfo.color }]}>
            {typeInfo.label}
          </Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: statusInfo.bgColor }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* 反馈内容 */}
      <Text style={styles.content} numberOfLines={isExpanded ? undefined : 2}>
        {feedback.content}
      </Text>

      {/* 底部：时间和回复指示 */}
      <View style={styles.cardFooter}>
        <Text style={styles.timeText}>{formatDate(feedback.createdAt || '')}</Text>
        {hasReply && (
          <View style={styles.replyIndicator}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
            <Text style={styles.replyText}>有回复</Text>
          </View>
        )}
      </View>

      {/* 展开时显示管理员回复 */}
      {isExpanded && hasReply && (
        <View style={styles.replyContainer}>
          <View style={styles.replyDivider} />
          <View style={styles.replyHeader}>
            <Ionicons name="return-down-forward" size={16} color={Colors.primary} />
            <Text style={styles.replyTitle}>官方回复</Text>
          </View>
          <Text style={styles.replyContent}>{feedback.adminReply}</Text>
        </View>
      )}

      {/* 展开/收起指示器 */}
      <View style={styles.expandIndicator}>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function MyFeedbacksScreen() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 加载反馈列表
  const loadFeedbacks = useCallback(async () => {
    try {
      const response = await FeedbackService.getMyFeedbacks();
      if (response.code === 0 && response.data) {
        setFeedbacks(response.data);
      } else {
        throw new Error(response.message || '加载失败');
      }
    } catch (error: any) {
      console.error('加载反馈列表失败:', error);
      Alert.alert('加载失败', error.message || '请稍后重试');
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadFeedbacks();
      setLoading(false);
    };
    init();
  }, [loadFeedbacks]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeedbacks();
    setRefreshing(false);
  }, [loadFeedbacks]);

  // 切换展开状态
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 渲染内容
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }

    if (feedbacks.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>暂无反馈记录</Text>
          <Text style={styles.emptyDesc}>您还没有提交过反馈，遇到问题欢迎随时反馈给我们</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 提示信息 */}
        <View style={styles.tipContainer}>
          <Ionicons name="information-circle" size={16} color={Colors.primary} />
          <Text style={styles.tipText}>
            共 {feedbacks.length} 条反馈，点击卡片查看官方回复
          </Text>
        </View>

        {/* 反馈列表 */}
        <View style={styles.listContainer}>
          {feedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              isExpanded={expandedId === feedback.id}
              onToggle={() => toggleExpand(feedback.id!)}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.card,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 6,
  },
  tipText: {
    fontSize: 13,
    color: Colors.primary,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  cardExpanded: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  content: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  replyText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  replyContainer: {
    marginTop: 12,
  },
  replyDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  replyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  replyContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 4,
  },
});

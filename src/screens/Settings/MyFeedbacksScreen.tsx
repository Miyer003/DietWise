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
import { Theme } from '../../constants/Theme';
import { FeedbackService } from '../../services/api';
import { Feedback } from '../../types';
import ScreenHeader from '../../components/ScreenHeader';

// 反馈类型映射
const FEEDBACK_TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  bug: { label: '问题反馈', icon: 'bug', color: Theme.colors.danger },
  feature: { label: '功能建议', icon: 'bulb', color: Theme.colors.warning },
  data_error: { label: '数据错误', icon: 'warning', color: Theme.colors.info },
  other: { label: '其他', icon: 'chatbubbles', color: Theme.colors.success },
};

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: Theme.colors.warning, bgColor: Theme.colors.highlight },
  processing: { label: '处理中', color: Theme.colors.info, bgColor: '#E8F0F3' },
  resolved: { label: '已解决', color: Theme.colors.success, bgColor: Theme.colors.highlight },
  rejected: { label: '已关闭', color: '#6B7280', bgColor: Theme.colors.cream },
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
            <Ionicons name="checkmark-circle" size={14} color={Theme.colors.primary} />
            <Text style={styles.replyText}>有回复</Text>
          </View>
        )}
      </View>

      {/* 展开时显示管理员回复 */}
      {isExpanded && hasReply && (
        <View style={styles.replyContainer}>
          <View style={styles.replyDivider} />
          <View style={styles.replyHeader}>
            <Ionicons name="return-down-forward" size={16} color={Theme.colors.primary} />
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
          color={Theme.colors.textMuted}
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
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }

    if (feedbacks.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={48} color={Theme.colors.textMuted} />
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
        <ScreenHeader title="我的反馈" subtitle="查看已提交的反馈与官方回复" />

        {/* 提示信息 */}
        <View style={styles.tipContainer}>
          <Ionicons name="information-circle" size={16} color={Theme.colors.primary} />
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
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  emptyDesc: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.highlight,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.compact,
    borderRadius: Theme.radius.xs,
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.xs,
  },
  tipText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.primary,
  },
  listContainer: {
    gap: Theme.spacing.md,
  },
  card: {
    marginBottom: Theme.spacing.compact,

    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
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
    marginBottom: Theme.spacing.md,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.md,
  },
  typeText: {
    fontSize: Theme.typography.sizes.small,
    fontWeight: Theme.typography.weights.medium,
  },
  statusTag: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
  },
  statusText: {
    fontSize: Theme.typography.sizes.small,
    fontWeight: Theme.typography.weights.medium,
  },
  content: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.text,
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    lineHeight: 16,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
  },
  replyText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  replyContainer: {
    marginTop: Theme.spacing.md,
  },
  replyDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  replyTitle: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.primary,
  },
  replyContent: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.text,
    lineHeight: 20,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.xs,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.xs,
  },
});

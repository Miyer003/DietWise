import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';
import { FeedbackService } from '../../services/api';

const FEEDBACK_TYPES = [
  { key: 'bug', label: '问题反馈', icon: 'bug-outline', color: Theme.colors.danger },
  { key: 'feature', label: '功能建议', icon: 'bulb-outline', color: Theme.colors.warning },
  { key: 'data_error', label: '数据错误', icon: 'alert-circle-outline', color: Theme.colors.secondary },
  { key: 'other', label: '其他', icon: 'chatbubble-outline', color: Theme.colors.success },
];

type FeedbackType = 'bug' | 'feature' | 'data_error' | 'other';

export default function FeedbackScreen({ navigation }: any) {
  const [selectedType, setSelectedType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }

    setLoading(true);
    try {
      const response = await FeedbackService.submitFeedback({
        type: selectedType,
        content: content.trim(),
        contactInfo: contact.trim() || undefined,
      });

      if (response.code === 0) {
        Alert.alert(
          '提交成功',
          '感谢您的反馈，我们会尽快处理！',
          [{ text: '确定', onPress: () => {
            setContent('');
            setContact('');
          }}]
        );
      } else {
        throw new Error(response.message || '提交失败');
      }
    } catch (error: any) {
      Alert.alert('提交失败', error.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="意见反馈" subtitle="遇到问题或有好的建议？欢迎告诉我们" />

        {/* 查看我的反馈入口 */}
        <TouchableOpacity 
          style={styles.myFeedbackBtn}
          onPress={() => navigation.navigate('MyFeedbacks')}
        >
          <Ionicons name="document-text-outline" size={16} color={Theme.colors.primary} />
          <Text style={styles.myFeedbackText}>查看我的反馈</Text>
          <Ionicons name="chevron-forward" size={16} color={Theme.colors.primary} />
        </TouchableOpacity>

        {/* 反馈类型选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>反馈类型</Text>
          <View style={styles.typeContainer}>
            {FEEDBACK_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeItem,
                  selectedType === type.key && { 
                    backgroundColor: type.color + '20',
                    borderColor: type.color,
                  }
                ]}
                onPress={() => setSelectedType(type.key as FeedbackType)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={20} 
                  color={selectedType === type.key ? type.color : Theme.colors.textMuted} 
                />
                <Text style={[
                  styles.typeText,
                  selectedType === type.key && { color: type.color, fontWeight: '600' }
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 反馈内容 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>反馈内容 <Text style={styles.required}>*</Text></Text>
          <View style={styles.card}>
            <TextInput
              style={styles.contentInput}
              multiline
              numberOfLines={6}
              placeholder="请详细描述您遇到的问题或建议，帮助我们更好地改进..."
              value={content}
              onChangeText={setContent}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{content.length}/500</Text>
          </View>
        </View>

        {/* 联系方式 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系方式（选填）</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.contactInput}
              placeholder="手机号/邮箱/微信，方便我们与您联系"
              value={contact}
              onChangeText={setContact}
              maxLength={100}
            />
          </View>
        </View>

        {/* 提交按钮 */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.submitBtn, (!content.trim() || loading) && styles.submitBtnDisabled]}
            onPress={submitFeedback}
            disabled={!content.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>提交反馈</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.tipText}>提交后可点击上方"查看我的反馈"了解处理进度</Text>
        </View>

        <View style={{ height: 40 }} />
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
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
  },
  myFeedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.page,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    gap: Theme.spacing.xs,
  },
  myFeedbackText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  section: {
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.page,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  required: {
    color: Theme.colors.danger,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.compact,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.compact,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  typeText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  contentInput: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    lineHeight: 20,
    minHeight: 120,
    paddingTop: Theme.spacing.xs,
  },
  contactInput: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    height: 44,
  },
  charCount: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    textAlign: 'right',
    marginTop: Theme.spacing.sm,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.compact,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
  },
  tipText: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FeedbackService } from '../../services/api';

type FeedbackType = 'bug' | 'feature' | 'data_error' | 'other';

interface FeedbackTypeOption {
  value: FeedbackType;
  label: string;
  icon: string;
}

const FEEDBACK_TYPES: FeedbackTypeOption[] = [
  { value: 'bug', label: '功能异常', icon: '🐛' },
  { value: 'feature', label: '功能建议', icon: '💡' },
  { value: 'data_error', label: '数据错误', icon: '📊' },
  { value: 'other', label: '其他问题', icon: '📝' },
];

export default function FeedbackScreen({ navigation }: any) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }

    if (content.trim().length < 10) {
      Alert.alert('提示', '反馈内容至少需要10个字');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await FeedbackService.submitFeedback({
        type,
        content: content.trim(),
        contact_info: contact.trim() || undefined,
      });

      if (response.code === 0) {
        Alert.alert('提交成功', '感谢您的反馈，我们会尽快处理！', [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error(response.message || '提交失败');
      }
    } catch (error: any) {
      Alert.alert('提交失败', error.message || '请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* 反馈类型选择 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>反馈类型</Text>
          <View style={styles.typeGrid}>
            {FEEDBACK_TYPES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.typeBtn, type === item.value && styles.typeBtnActive]}
                onPress={() => setType(item.value)}
              >
                <Text style={styles.typeIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.typeText,
                    type === item.value && styles.typeTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 反馈内容 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>反馈内容</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.contentInput}
              multiline
              numberOfLines={6}
              placeholder="请详细描述您遇到的问题或建议..."
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
              maxLength={500}
            />
            <Text style={styles.charCount}>{content.length}/500</Text>
          </View>
        </View>

        {/* 联系方式 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系方式（选填）</Text>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.contactInput}
              placeholder="手机号/邮箱/微信，方便我们联系您"
              value={contact}
              onChangeText={setContact}
              maxLength={100}
            />
          </View>
        </View>

        {/* 提示信息 */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={Colors.info} />
          <Text style={styles.tipText}>
            您的反馈对我们非常重要，我们会认真阅读每一条建议。如有紧急问题，请联系客服：400-xxx-xxxx
          </Text>
        </View>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitBtnText}>提交反馈</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  typeTextActive: {
    color: Colors.primary,
  },
  inputCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  contentInput: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  contactInput: {
    fontSize: 15,
    color: Colors.text,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

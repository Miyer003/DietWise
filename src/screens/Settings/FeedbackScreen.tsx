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
import Colors from '../../constants/Colors';
import { FeedbackService } from '../../services/api';

const FEEDBACK_TYPES = [
  { key: 'bug', label: '问题反馈', icon: 'bug', color: '#EF4444' },
  { key: 'feature', label: '功能建议', icon: 'bulb', color: '#F59E0B' },
  { key: 'data_error', label: '数据错误', icon: 'warning', color: '#3B82F6' },
  { key: 'other', label: '其他', icon: 'chatbubbles', color: '#10B981' },
];

export default function FeedbackScreen() {
  const [selectedType, setSelectedType] = useState<string>('bug');
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
        {/* 说明卡片 */}
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>意见反馈</Text>
              <Text style={styles.infoDesc}>
                遇到问题或有好的建议？欢迎告诉我们，我们会认真阅读每一条反馈。
              </Text>
            </View>
          </View>
        </View>

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
                onPress={() => setSelectedType(type.key)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={20} 
                  color={selectedType === type.key ? type.color : Colors.textMuted} 
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
          <Text style={styles.tipText}>提交后可在后台管理查看处理进度</Text>
        </View>

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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    margin: 16,
  },
  infoHeader: {
    flexDirection: 'row',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  required: {
    color: Colors.danger,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contentInput: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    minHeight: 120,
    paddingTop: 4,
  },
  contactInput: {
    fontSize: 14,
    color: Colors.text,
    height: 44,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

const ChatScreen: React.FC = () => {
  const quickQuestions = [
    '今天还能吃多少？',
    '推荐今晚晚餐',
    '分析本周趋势',
    '孕妇能吃什么？',
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 顶部数据快照 */}
      <View style={styles.snapshot}>
        <View style={styles.snapshotContent}>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotValue}>1,250</Text>
            <Text style={styles.snapshotLabel}>已摄入</Text>
          </View>
          <View style={styles.snapshotItem}>
            <Text style={[styles.snapshotValue, { color: Colors.success }]}>750</Text>
            <Text style={styles.snapshotLabel}>剩余额度</Text>
          </View>
          <View style={styles.snapshotItem}>
            <Text style={[styles.snapshotValue, { color: Colors.warning }]}>2</Text>
            <Text style={styles.snapshotLabel}>餐次记录</Text>
          </View>
        </View>
      </View>

      {/* 聊天区域 */}
      <ScrollView style={styles.chatContainer}>
        {/* AI欢迎消息 */}
        <View style={styles.messageLeft}>
          <Text style={styles.messageText}>
            👋 您好！我是您的AI营养顾问{'\n\n'}
            我已同步您今日的饮食记录。今日蛋白质摄入充足，但蔬菜略显不足。有什么可以帮您？
          </Text>
        </View>

        {/* 快捷问题 */}
        <View style={styles.quickQuestions}>
          {quickQuestions.map((q, index) => (
            <TouchableOpacity key={index} style={styles.quickQuestionBtn}>
              <Text style={styles.quickQuestionText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 用户消息示例 */}
        <View style={styles.messageRight}>
          <Text style={styles.messageTextRight}>今天还能吃多少热量？</Text>
        </View>

        {/* AI回复示例 */}
        <View style={styles.messageLeft}>
          <Text style={styles.messageText}>
            根据您今日的记录和目标：{'\n\n'}
            ✓ 剩余可摄入 <Text style={{ fontWeight: 'bold' }}>750 kcal</Text>{'\n'}
            ⚠ 建议主食控制在150g以内{'\n'}
            ✓ 必须补充蔬菜（至少150g）
          </Text>
        </View>
      </ScrollView>

      {/* 底部输入框 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TextInput 
            style={styles.input}
            placeholder="输入您的饮食问题..."
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>📷 拍照识菜</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>📊 查看报告</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>📅 历史记录</Text>
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
  messageLeft: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
    maxWidth: '80%',
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
    maxWidth: '80%',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  messageTextRight: {
    fontSize: 15,
    color: 'white',
  },
  quickQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default ChatScreen;
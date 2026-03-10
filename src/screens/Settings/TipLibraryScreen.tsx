import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

interface Tip {
  id: string;
  content: string;
  color: 'pink' | 'green' | 'blue';
}

export default function TipLibraryScreen() {
  const [tips, setTips] = useState<Tip[]>([
    { id: '1', content: '记得多喝水，每天至少2000ml！', color: 'pink' },
    { id: '2', content: '晚餐尽量在6点前完成，有助于消化和睡眠质量。', color: 'green' },
  ]);
  const [newTip, setNewTip] = useState('');

  const quickAddTips = [
    { text: '💧 每天喝足2L水，保持身体水分平衡', color: 'blue' },
    { text: '🥬 每餐至少吃一把蔬菜，补充膳食纤维', color: 'green' },
    { text: '🌙 晚上8点后不要进食，让胃休息', color: 'orange' },
    { text: '🤤 细嚼慢咽，每口嚼20下以上', color: 'blue' },
    { text: '📱 不要边看手机边吃饭，专注享受美食', color: 'purple' },
  ];

  const addTip = () => {
    if (newTip.trim()) {
      setTips([...tips, { id: Date.now().toString(), content: newTip, color: 'green' }]);
      setNewTip('');
    }
  };

  const quickAdd = (text: string) => {
    const cleanText = text.replace(/^[💧🥬🌙🤤📱]\s*/, '');
    setTips([...tips, { id: Date.now().toString(), content: cleanText, color: 'green' }]);
  };

  const deleteTip = (id: string) => {
    setTips(tips.filter(t => t.id !== id));
  };

  const getBorderColor = (color: string) => {
    switch(color) {
      case 'pink': return '#F472B6';
      case 'green': return '#34D399';
      case 'blue': return '#60A5FA';
      default: return Colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 说明卡片 */}
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>如何使用</Text>
              <Text style={styles.infoDesc}>
                添加您想在首页展示的个性化提示，如果没有添加任何提示，系统将自动展示AI智能建议。
              </Text>
            </View>
          </View>
        </View>

        {/* 已添加的提示 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              已添加的提示 <Text style={styles.count}>({tips.length}条)</Text>
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>随机展示</Text>
            </View>
          </View>

          {tips.map((tip) => (
            <View 
              key={tip.id} 
              style={[styles.tipCard, { borderLeftColor: getBorderColor(tip.color), borderLeftWidth: 4 }]}
            >
              <Text style={styles.tipText}>{tip.content}</Text>
              <View style={styles.tipActions}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="create-outline" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.iconBtn, styles.deleteBtn]}
                  onPress={() => deleteTip(tip.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* 添加新提示 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>添加新提示</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="输入您想在首页展示的提示，如：记得多喝水、今天要吃蔬菜..."
              value={newTip}
              onChangeText={setNewTip}
              maxLength={100}
            />
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>最多100字</Text>
              <TouchableOpacity 
                style={[styles.addBtn, !newTip.trim() && styles.addBtnDisabled]}
                onPress={addTip}
                disabled={!newTip.trim()}
              >
                <Text style={styles.addBtnText}>添加提示</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 预设建议 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            预设建议 <Text style={styles.hint}>(点击快速添加)</Text>
          </Text>
          <View style={styles.quickTags}>
            {quickAddTips.map((tip, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.quickTag, { backgroundColor: '#F3F4F6' }]}
                onPress={() => quickAdd(tip.text)}
              >
                <Text style={styles.quickTagText}>{tip.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 0,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoHeader: {
    flexDirection: 'row',
  },
  infoTitle: {
    fontSize: 15,
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
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  count: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: 'normal',
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginRight: 12,
  },
  tipActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  addBtn: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: 'normal',
  },
  quickTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickTagText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
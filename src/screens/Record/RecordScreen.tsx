import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function RecordScreen({ navigation }: any) {
  const recentFoods = [
    { icon: '🍚', name: '米饭' },
    { icon: '🥚', name: '鸡蛋' },
    { icon: '🥛', name: '牛奶' },
    { icon: '🥩', name: '鸡胸肉' },
    { icon: '🍎', name: '苹果' },
    { icon: '🥬', name: '西兰花' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 顶部导航 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>添加记录</Text>
            <Text style={styles.subtitle}>选择记录方式</Text>
          </View>
        </View>

        {/* 三种记录方式 */}
        <View style={styles.methodsContainer}>
          {/* 拍照识菜 */}
          <TouchableOpacity 
            style={styles.methodCard}
            onPress={() => navigation.navigate('Camera')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.info }]}>
              <Text style={styles.iconText}>📷</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>拍照识菜</Text>
              <Text style={styles.methodDesc}>AI识别菜品并估算热量</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* 语音速记 */}
          <TouchableOpacity style={styles.methodCard}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.purple }]}>
              <Text style={styles.iconText}>🎤</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>语音速记</Text>
              <Text style={styles.methodDesc}>按住说话，自动解析食物名称</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* 手动输入 */}
          <TouchableOpacity style={styles.methodCard}>
            <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
              <Text style={styles.iconText}>⌨️</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>手动输入</Text>
              <Text style={styles.methodDesc}>搜索食物库，精确记录分量</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 最近常吃 */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>最近常吃 • 点击快速添加</Text>
          <View style={styles.tagsContainer}>
            {recentFoods.map((food, index) => (
              <TouchableOpacity key={index} style={styles.tag}>
                <Text style={styles.tagText}>{food.icon} {food.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 底部留白 */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  methodsContainer: {
    padding: 16,
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  recentSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '500',
  },
});
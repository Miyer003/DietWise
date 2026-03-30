import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

export default function ConsultScreen({ navigation }: any) {
  const hotQuestions = [
    '减脂期怎么吃不饿？',
    '运动后怎么补充蛋白质？',
    '哪些食物不能一起吃？',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 顶部标题 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>健康咨询</Text>
            <Text style={styles.subtitle}>AI助力您的饮食健康</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={28} color={Colors.primary} />
          </View>
        </View>

        {/* 功能入口 */}
        <View style={styles.cardsContainer}>
          {/* 智能生成食谱 */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('AIGeneratePlanInput')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.warning }]}>
              <Ionicons name="restaurant" size={24} color={Colors.textInverse} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>智能生成食谱</Text>
              <Text style={styles.featureDesc}>AI根据您的身体数据和目标，自动生成饮食方案</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* AI营养顾问 */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
              <Ionicons name="chatbubbles" size={24} color={Colors.textInverse} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>AI营养顾问</Text>
              <Text style={styles.featureDesc}>随时咨询饮食问题，获取专业健康建议</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 标签 */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>AI分析</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: Colors.primaryLight }]}>
            <Text style={[styles.tagText, { color: Colors.primaryDark }]}>科学配比</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.tagText, { color: '#D97706' }]}>一键生成</Text>
          </View>
        </View>

        {/* 热门问题 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>热门咨询问题</Text>
          {hotQuestions.map((question, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.questionItem}
              onPress={() => navigation.navigate('Chat', { initialMessage: question })}
            >
              <Text style={styles.questionText}>{question}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 32,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: -8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    color: '#EA580C',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  questionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: Colors.text,
  },
});
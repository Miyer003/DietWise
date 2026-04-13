import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';

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
        <ScreenHeader
          title="健康咨询"
          subtitle="AI助力您的饮食健康"
          rightIcon="sparkles"
        />

        {/* 功能入口 */}
        <View style={styles.cardsContainer}>
          {/* 智能生成食谱 */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('AIGeneratePlanInput')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Theme.colors.warning }]}>
              <Ionicons name="restaurant" size={24} color={Theme.colors.textInverse} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>智能生成食谱</Text>
              <Text style={styles.featureDesc}>AI根据您的身体数据和目标，自动生成饮食方案</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Theme.colors.textMuted} />
          </TouchableOpacity>

          {/* AI营养顾问 */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={[styles.iconContainer, { backgroundColor: Theme.colors.primary }]}>
              <Ionicons name="chatbubbles" size={24} color={Theme.colors.textInverse} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>AI营养顾问</Text>
              <Text style={styles.featureDesc}>随时咨询饮食问题，获取专业健康建议</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 标签 */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>AI分析</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: Theme.colors.primaryLight }]}>
            <Text style={[styles.tagText, { color: Theme.colors.primaryDark }]}>科学配比</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: Theme.colors.highlight }]}>
            <Text style={[styles.tagText, { color: Theme.colors.primaryDark }]}>一键生成</Text>
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
              <Ionicons name="chevron-forward" size={16} color={Theme.colors.textMuted} />
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
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  cardsContainer: {
    padding: Theme.spacing.lg,
    gap: Theme.spacing.compact,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.lg,
  },
  iconText: {
    fontSize: 32,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Theme.typography.sizes.h2,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  featureDesc: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    gap: Theme.spacing.sm,
    marginTop: -8,
    marginBottom: Theme.spacing.lg,
  },
  tag: {
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: Theme.spacing.compact,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.xs,
  },
  tagText: {
    color: Theme.colors.primaryDark,
    fontSize: Theme.typography.sizes.small,
    fontWeight: Theme.typography.weights.medium,
  },
  section: {
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.compact,
  },
  questionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    marginBottom: Theme.spacing.sm,
  },
  questionText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
  },
});
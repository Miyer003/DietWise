import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';

const APP_VERSION = '2.0.0';
const BUILD_NUMBER = '20250311';

const LINKS = [
  { title: '用户协议', url: 'https://dietwise.cn/terms' },
  { title: '隐私政策', url: 'https://dietwise.cn/privacy' },
  { title: '开源许可', url: 'https://dietwise.cn/licenses' },
];

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <ScreenHeader title="关于 DietWise" subtitle="版本信息与应用介绍" />

        {/* Logo区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Ionicons name="leaf" size={50} color={Theme.colors.primary} />
          </View>
          <Text style={styles.appName}>膳智 DietWise</Text>
          <Text style={styles.version}>版本 {APP_VERSION} ({BUILD_NUMBER})</Text>
        </View>

        {/* 应用介绍 */}
        <View style={styles.card}>
          <Text style={styles.description}>
            膳智是一款基于AI技术的智能饮食健康管理应用。通过拍照识菜、语音速记等方式，
            帮助用户轻松记录饮食、科学分析营养、获取个性化饮食建议。
          </Text>
        </View>

        {/* 功能特点 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>核心功能</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: 'camera', title: 'AI拍照识菜', desc: '智能识别菜品与热量' },
              { icon: 'mic', title: '语音速记', desc: '语音快速记录饮食' },
              { icon: 'bar-chart', title: '营养分析', desc: '多维度数据分析' },
              { icon: 'sparkles', title: 'AI顾问', desc: '个性化饮食建议' },
              { icon: 'restaurant', title: '智能食谱', desc: 'AI定制一周食谱' },
              { icon: 'trophy', title: '成就系统', desc: '养成健康习惯' },
            ].map((feature: { icon: React.ComponentProps<typeof Ionicons>['name'], title: string, desc: string }, index: number) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name={feature.icon} size={28} color={Theme.colors.primary} style={styles.featureIcon} />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 链接列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.linksCard}>
            {LINKS.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.linkItem,
                  index < LINKS.length - 1 && styles.linkItemBorder,
                ]}
                onPress={() => openLink(link.url)}
              >
                <Text style={styles.linkText}>{link.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color={Theme.colors.textSecondary} />
              <Text style={styles.contactText}>support@dietwise.cn</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="globe-outline" size={20} color={Theme.colors.textSecondary} />
              <Text style={styles.contactText}>www.dietwise.cn</Text>
            </View>
          </View>
        </View>

        {/* 版权信息 */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2025 膳智 DietWise</Text>
          <Text style={styles.copyright}>All Rights Reserved</Text>
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 24,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  version: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textMuted,
  },
  card: {
    backgroundColor: Theme.colors.card,
    margin: Theme.spacing.lg,
    padding: Theme.spacing.page,
    borderRadius: Theme.radius.lg,
  },
  description: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.compact,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.compact,
  },
  featureItem: {
    width: (require('react-native').Dimensions.get('window').width - 56) / 3,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: Theme.spacing.sm,
  },
  featureTitle: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  featureDesc: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  linksCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  linkItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkText: {
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.text,
  },
  contactCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.lg,
    gap: Theme.spacing.compact,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.compact,
  },
  contactText: {
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.text,
  },
  footer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
  },
  copyright: {
    fontSize: Theme.typography.sizes.small,
    color: Theme.colors.textMuted,
  },
});

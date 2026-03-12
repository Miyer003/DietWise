import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

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
        {/* Logo区域 */}
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🥗</Text>
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
              { icon: '📷', title: 'AI拍照识菜', desc: '智能识别菜品与热量' },
              { icon: '🎤', title: '语音速记', desc: '语音快速记录饮食' },
              { icon: '📊', title: '营养分析', desc: '多维度数据分析' },
              { icon: '🤖', title: 'AI顾问', desc: '个性化饮食建议' },
              { icon: '🥡', title: '智能食谱', desc: 'AI定制一周食谱' },
              { icon: '🏆', title: '成就系统', desc: '养成健康习惯' },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
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
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 联系我们 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系我们</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.contactText}>support@dietwise.cn</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="globe-outline" size={20} color={Colors.textSecondary} />
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.primaryLight,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    width: (require('react-native').Dimensions.get('window').width - 56) / 3,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  linksCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  linkItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  linkText: {
    fontSize: 15,
    color: Colors.text,
  },
  contactCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    color: Colors.text,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 16,
  },
  copyright: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});

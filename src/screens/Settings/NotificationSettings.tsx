import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { NotificationService } from '../../services/api';
import { NotificationSettings as NotificationSettingsType } from '../../types';

// 默认设置
const DEFAULT_SETTINGS: NotificationSettingsType = {
  masterEnabled: true,
  breakfastEnabled: true,
  breakfastTime: '07:30',
  lunchEnabled: true,
  lunchTime: '12:00',
  dinnerEnabled: true,
  dinnerTime: '18:00',
  waterEnabled: false,
  waterIntervalH: 2,
  waterStartTime: '08:00',
  waterEndTime: '22:00',
  recordRemind: true,
  bedtimeRemind: false,
  bedtimeTime: '21:30',
};

// 时间选择器包装组件
function TimePickerButton({
  time,
  onChange,
  disabled = false,
}: {
  time: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);

  const parseTime = (t: string): Date => {
    const [hours, minutes] = t.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate && event.type !== 'dismissed') {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.timeBtn, disabled && styles.timeBtnDisabled]}
        onPress={() => !disabled && setShow(true)}
        disabled={disabled}
      >
        <Text style={[styles.timeText, disabled && styles.timeTextDisabled]}>
          {time}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={parseTime(time)}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </>
  );
}

// 设置项行组件
function SettingRow({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  children,
  masterEnabled = true,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  children?: React.ReactNode;
  masterEnabled?: boolean;
}) {
  return (
    <View style={[styles.settingItem, !masterEnabled && styles.settingItemDisabled]}>
      <View style={styles.settingHeader}>
        <Text style={[styles.settingIcon, !masterEnabled && styles.settingIconDisabled]}>
          {icon}
        </Text>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, !masterEnabled && styles.settingTitleDisabled]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, !masterEnabled && styles.settingSubtitleDisabled]}>
              {subtitle}
            </Text>
          )}
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E5E7EB', true: Colors.primary }}
          thumbColor="white"
          disabled={!masterEnabled}
        />
      </View>
      {enabled && children && (
        <View style={styles.settingDetail}>{children}</View>
      )}
    </View>
  );
}

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsType>(DEFAULT_SETTINGS);

  // 加载设置
  const loadSettings = useCallback(async () => {
    try {
      const response = await NotificationService.getSettings();
      if (response.code === 0 && response.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...response.data });
      }
    } catch (error) {
      console.error('加载提醒设置失败:', error);
      Alert.alert('加载失败', '无法加载提醒设置，使用默认设置');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadSettings();
    requestNotificationPermission();
  }, [loadSettings]);

  // 请求通知权限并注册Push Token
  const requestNotificationPermission = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted' && Platform.OS !== 'web') {
        // 获取 Expo Push Token（仅在原生平台）
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const notificationsAny = Notifications as any;
          const tokenResponse = await notificationsAny.getExpoPushTokenAsync();
          const token = tokenResponse.data as string;
          console.log('Expo Push Token:', token);
          
          // 注册到后端
          await NotificationService.registerPushToken(token);
          console.log('Push Token 已注册到服务器');
        } catch (tokenError: any) {
          // Android 需要 FCM 配置，如果未配置会报错，这里静默处理
          console.log('获取 Push Token 失败:', tokenError.message || tokenError);
          if (Platform.OS === 'android') {
            console.log('提示：Android 需要配置 FCM 才能接收推送通知');
          }
        }
      }
    } catch (error) {
      console.error('获取通知权限失败:', error);
    }
  };

  // 保存设置（防抖）
  const saveSettings = useCallback(
    async (newSettings: NotificationSettingsType) => {
      setSaving(true);
      try {
        const response = await NotificationService.patchSettings(newSettings);
        if (response.code !== 0) {
          throw new Error(response.message);
        }
      } catch (error: any) {
        console.error('保存提醒设置失败:', error);
        Alert.alert('保存失败', error.message || '请稍后重试');
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // 更新单个设置字段
  const updateSetting = <K extends keyof NotificationSettingsType>(
    key: K,
    value: NotificationSettingsType[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // 更新饮水间隔
  const updateWaterInterval = (increment: number) => {
    const newInterval = Math.max(1, Math.min(4, settings.waterIntervalH + increment));
    updateSetting('waterIntervalH', newInterval);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 保存状态指示器 */}
      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="white" />
          <Text style={styles.savingText}>保存中...</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 主开关 */}
        <View style={styles.masterSwitch}>
          <View style={styles.masterIcon}>
            <Text style={{ fontSize: 24 }}>🔔</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.masterTitle}>接收通知提醒</Text>
            <Text style={styles.masterSubtitle}>打开后才会接收下面的提醒</Text>
          </View>
          <Switch
            value={settings.masterEnabled}
            onValueChange={(v) => updateSetting('masterEnabled', v)}
            trackColor={{ false: '#E5E7EB', true: Colors.primary }}
            thumbColor="white"
          />
        </View>

        {/* 餐次提醒 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, !settings.masterEnabled && styles.sectionTitleDisabled]}>
            提醒项设置
          </Text>

          {/* 早餐提醒 */}
          <SettingRow
            icon="🍳"
            title="早餐提醒"
            enabled={settings.breakfastEnabled}
            onToggle={(v) => updateSetting('breakfastEnabled', v)}
            masterEnabled={settings.masterEnabled}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TimePickerButton
                time={settings.breakfastTime}
                onChange={(t) => updateSetting('breakfastTime', t)}
                disabled={!settings.masterEnabled}
              />
              <Text style={styles.timeLabel}>提醒我吃早餐</Text>
            </View>
          </SettingRow>

          {/* 午餐提醒 */}
          <SettingRow
            icon="🍱"
            title="午餐提醒"
            enabled={settings.lunchEnabled}
            onToggle={(v) => updateSetting('lunchEnabled', v)}
            masterEnabled={settings.masterEnabled}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TimePickerButton
                time={settings.lunchTime}
                onChange={(t) => updateSetting('lunchTime', t)}
                disabled={!settings.masterEnabled}
              />
              <Text style={styles.timeLabel}>提醒我吃午餐</Text>
            </View>
          </SettingRow>

          {/* 晚餐提醒 */}
          <SettingRow
            icon="🌙"
            title="晚餐提醒"
            enabled={settings.dinnerEnabled}
            onToggle={(v) => updateSetting('dinnerEnabled', v)}
            masterEnabled={settings.masterEnabled}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TimePickerButton
                time={settings.dinnerTime}
                onChange={(t) => updateSetting('dinnerTime', t)}
                disabled={!settings.masterEnabled}
              />
              <Text style={styles.timeLabel}>提醒我吃晚餐</Text>
            </View>
          </SettingRow>

          {/* 饮水提醒 */}
          <SettingRow
            icon="💧"
            title="饮水提醒"
            enabled={settings.waterEnabled}
            onToggle={(v) => updateSetting('waterEnabled', v)}
            masterEnabled={settings.masterEnabled}
          >
            <View style={styles.waterSettings}>
              <View style={styles.waterIntervalRow}>
                <Text style={styles.timeLabel}>每隔</Text>
                <View style={styles.intervalControl}>
                  <TouchableOpacity
                    style={[styles.intervalBtn, !settings.masterEnabled && styles.intervalBtnDisabled]}
                    onPress={() => updateWaterInterval(-1)}
                    disabled={!settings.masterEnabled}
                  >
                    <Ionicons name="remove" size={16} color={settings.masterEnabled ? Colors.primary : Colors.textMuted} />
                  </TouchableOpacity>
                  <Text style={styles.intervalText}>{settings.waterIntervalH}小时</Text>
                  <TouchableOpacity
                    style={[styles.intervalBtn, !settings.masterEnabled && styles.intervalBtnDisabled]}
                    onPress={() => updateWaterInterval(1)}
                    disabled={!settings.masterEnabled}
                  >
                    <Ionicons name="add" size={16} color={settings.masterEnabled ? Colors.primary : Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeLabel}>提醒一次</Text>
              </View>
              <View style={styles.waterTimeRow}>
                <TimePickerButton
                  time={settings.waterStartTime}
                  onChange={(t) => updateSetting('waterStartTime', t)}
                  disabled={!settings.masterEnabled}
                />
                <Text style={styles.timeLabel}>至</Text>
                <TimePickerButton
                  time={settings.waterEndTime}
                  onChange={(t) => updateSetting('waterEndTime', t)}
                  disabled={!settings.masterEnabled}
                />
              </View>
            </View>
          </SettingRow>

          {/* 记录提醒 */}
          <SettingRow
            icon="✍️"
            title="记录提醒"
            subtitle="用餐后30分钟提醒记录饮食"
            enabled={settings.recordRemind}
            onToggle={(v) => updateSetting('recordRemind', v)}
            masterEnabled={settings.masterEnabled}
          />

          {/* 睡前提醒 */}
          <SettingRow
            icon="😴"
            title="睡前提醒"
            subtitle="提醒明日饮食计划"
            enabled={settings.bedtimeRemind}
            onToggle={(v) => updateSetting('bedtimeRemind', v)}
            masterEnabled={settings.masterEnabled}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TimePickerButton
                time={settings.bedtimeTime}
                onChange={(t) => updateSetting('bedtimeTime', t)}
                disabled={!settings.masterEnabled}
              />
              <Text style={styles.timeLabel}>提醒复盘当日饮食</Text>
            </View>
          </SettingRow>
        </View>

        {/* 测试推送 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={async () => {
              try {
                const response = await NotificationService.testPush();
                if (response.code === 0) {
                  Alert.alert('测试通知已发送', '如果推送功能正常，您将在几秒后收到通知');
                } else {
                  throw new Error(response.message);
                }
              } catch (error: any) {
                const isAndroidFCMError = Platform.OS === 'android' && 
                  error.message?.includes('Push Token');
                
                if (isAndroidFCMError) {
                  Alert.alert(
                    'Android 推送需要配置', 
                    'Android 设备需要配置 Firebase Cloud Messaging 才能接收推送通知。\n\n' +
                    '如需完整推送功能，请:\n' +
                    '1. 在 Firebase Console 创建项目\n' +
                    '2. 下载 google-services.json\n' +
                    '3. 放入 android/app/ 目录\n' +
                    '4. 重新构建应用'
                  );
                } else {
                  Alert.alert('发送失败', error.message || '请确保已开启通知权限并已注册设备');
                }
              }
            }}
          >
            <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
            <Text style={styles.testBtnText}>发送测试通知</Text>
          </TouchableOpacity>
        </View>

        {/* Android FCM 提示 */}
        {Platform.OS === 'android' && (
          <View style={[styles.tipCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={[styles.tipText, { color: '#B45309' }]}>
              Android 设备需要配置 Firebase Cloud Messaging 才能接收推送通知。如需完整推送功能，请参考 Expo 文档进行配置。
            </Text>
          </View>
        )}

        {/* 说明 */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.tipText}>
            提醒设置会自动同步到云端，即使更换设备也不会丢失。请确保开启系统通知权限以正常接收提醒。
          </Text>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  savingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
    zIndex: 100,
  },
  savingText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  masterSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  masterIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  masterSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionTitleDisabled: {
    color: Colors.textMuted,
  },
  settingItem: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
  },
  settingIconDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  settingTitleDisabled: {
    color: Colors.textMuted,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingSubtitleDisabled: {
    color: Colors.textMuted,
  },
  settingDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  timeBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  timeTextDisabled: {
    color: Colors.textMuted,
  },
  waterSettings: {
    gap: 12,
  },
  waterIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  intervalControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intervalBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  intervalText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    minWidth: 48,
    textAlign: 'center',
  },
  waterTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  testBtnText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
});

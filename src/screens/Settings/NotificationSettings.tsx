import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Switch 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

interface ReminderSetting {
  enabled: boolean;
  time?: string;
  label: string;
  icon: string;
  desc?: string;
}

export default function NotificationSettings() {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [breakfast, setBreakfast] = useState<ReminderSetting>({ enabled: true, time: '07:30', label: '早餐提醒', icon: '🍳' });
  const [lunch, setLunch] = useState<ReminderSetting>({ enabled: true, time: '12:00', label: '午餐提醒', icon: '🍱' });
  const [dinner, setDinner] = useState<ReminderSetting>({ enabled: true, time: '18:00', label: '晚餐提醒', icon: '🌙' });
  const [water, setWater] = useState({ enabled: false, interval: '2小时', start: '08:00', end: '22:00', label: '饮水提醒', icon: '💧' });
  const [record, setRecord] = useState({ enabled: true, label: '记录提醒', icon: '✍️', desc: '用餐后30分钟提醒' });
  const [bedtime, setBedtime] = useState<ReminderSetting>({ enabled: false, time: '21:30', label: '睡前提醒', icon: '😴', desc: '复盘当日饮食' });

  const ToggleRow: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    children?: React.ReactNode;
  }> = ({ icon, title, subtitle, value, onValueChange, children }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E5E7EB', true: Colors.primary }}
          thumbColor="white"
        />
      </View>
      {value && children && <View style={styles.settingDetail}>{children}</View>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
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
            value={masterEnabled}
            onValueChange={setMasterEnabled}
            trackColor={{ false: '#E5E7EB', true: Colors.primary }}
            thumbColor="white"
          />
        </View>

        {/* 餐次提醒 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒项设置</Text>
          
          <ToggleRow
            icon="🍳"
            title="早餐提醒"
            value={breakfast.enabled}
            onValueChange={(v) => setBreakfast({ ...breakfast, enabled: v })}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TouchableOpacity style={styles.timeBtn}>
                <Text style={styles.timeText}>{breakfast.time}</Text>
              </TouchableOpacity>
              <Text style={styles.timeLabel}>提醒我吃早餐</Text>
            </View>
          </ToggleRow>

          <ToggleRow
            icon="🍱"
            title="午餐提醒"
            value={lunch.enabled}
            onValueChange={(v) => setLunch({ ...lunch, enabled: v })}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TouchableOpacity style={styles.timeBtn}>
                <Text style={styles.timeText}>{lunch.time}</Text>
              </TouchableOpacity>
              <Text style={styles.timeLabel}>提醒我吃午餐</Text>
            </View>
          </ToggleRow>

          <ToggleRow
            icon="🌙"
            title="晚餐提醒"
            value={dinner.enabled}
            onValueChange={(v) => setDinner({ ...dinner, enabled: v })}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TouchableOpacity style={styles.timeBtn}>
                <Text style={styles.timeText}>{dinner.time}</Text>
              </TouchableOpacity>
              <Text style={styles.timeLabel}>提醒我吃晚餐</Text>
            </View>
          </ToggleRow>

          <ToggleRow
            icon="💧"
            title="饮水提醒"
            value={water.enabled}
            onValueChange={(v) => setWater({ ...water, enabled: v })}
          >
            <View style={styles.waterSettings}>
              <View style={styles.timeSelector}>
                <Text style={styles.timeLabel}>每隔</Text>
                <TouchableOpacity style={styles.timeBtn}>
                  <Text style={styles.timeText}>{water.interval}</Text>
                </TouchableOpacity>
                <Text style={styles.timeLabel}>提醒一次</Text>
              </View>
              <Text style={styles.hint}>运行时间：{water.start} - {water.end}</Text>
            </View>
          </ToggleRow>

          <ToggleRow
            icon="✍️"
            title="记录提醒"
            subtitle="用餐后30分钟提醒记录饮食"
            value={record.enabled}
            onValueChange={(v) => setRecord({ ...record, enabled: v })}
          >
            <View style={styles.radioGroup}>
              <Text style={styles.radioLabel}>提醒方式：</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity style={styles.radio}>
                  <View style={[styles.radioCircle, styles.radioSelected]} />
                  <Text style={styles.radioText}>通知栏</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.radio}>
                  <View style={styles.radioCircle} />
                  <Text style={styles.radioText}>弹窗</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ToggleRow>

          <ToggleRow
            icon="😴"
            title="睡前提醒"
            subtitle="提醒明日饮食计划"
            value={bedtime.enabled}
            onValueChange={(v) => setBedtime({ ...bedtime, enabled: v })}
          >
            <View style={styles.timeSelector}>
              <Text style={styles.timeLabel}>每天</Text>
              <TouchableOpacity style={styles.timeBtn}>
                <Text style={styles.timeText}>{bedtime.time}</Text>
              </TouchableOpacity>
              <Text style={styles.timeLabel}>提醒复盘</Text>
            </View>
          </ToggleRow>
        </View>

        {/* 提醒音设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒音设置</Text>
          <View style={styles.card}>
            <View style={styles.soundRow}>
              <Text style={styles.soundLabel}>提醒音效果</Text>
              <TouchableOpacity style={styles.soundSelector}>
                <Text style={styles.soundText}>默认提示音</Text>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.soundRow}>
              <Text style={styles.soundLabel}>震动</Text>
              <Switch
                value={true}
                trackColor={{ false: '#E5E7EB', true: Colors.primary }}
                thumbColor="white"
              />
            </View>
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
  settingItem: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
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
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  waterSettings: {
    gap: 8,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  radioGroup: {
    gap: 8,
  },
  radioLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textMuted,
  },
  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioText: {
    fontSize: 14,
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  soundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soundLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  soundSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soundText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 18,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
});
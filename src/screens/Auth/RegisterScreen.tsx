import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../store/AuthContext';
import { AuthService } from '../../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const { register } = useAuth();

  // 发送短信验证码
  const sendSmsCode = async () => {
    if (!phone || phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setIsSendingSms(true);
    try {
      const response = await AuthService.sendSmsCode(phone);
      if (response.code === 0) {
        Alert.alert('成功', '验证码已发送');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert('错误', response.message || '发送失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '发送失败');
    } finally {
      setIsSendingSms(false);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    // 表单验证
    if (!phone || phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    if (!smsCode) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    if (!password || password.length < 8) {
      Alert.alert('提示', '密码至少8位，需包含字母和数字');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    if (!agreed) {
      Alert.alert('提示', '请阅读并同意用户协议和隐私政策');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        phone,
        password,
        smsCode: smsCode,
        nickname: nickname || undefined,
      });
      // 注册成功，跳转到登录页
      Alert.alert('注册成功', '请使用密码登录', [
        { 
          text: '确定', 
          onPress: () => navigation.navigate('Login', { phone, password })
        }
      ]);
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="创建账号" subtitle="开启您的健康饮食之旅" />

          {/* 输入区域 */}
          <View style={styles.inputContainer}>
            {/* 昵称 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>昵称（选填）</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="给自己起个名字吧"
                  maxLength={20}
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>
            </View>

            {/* 手机号 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>手机号</Text>
              <View style={styles.inputBox}>
                <Text style={styles.prefix}>+86</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入手机号"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* 验证码 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>验证码</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="请输入验证码"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={smsCode}
                  onChangeText={setSmsCode}
                />
                <TouchableOpacity
                  style={[styles.smsBtn, countdown > 0 && styles.smsBtnDisabled]}
                  onPress={sendSmsCode}
                  disabled={countdown > 0 || isSendingSms}
                >
                  {isSendingSms ? (
                    <ActivityIndicator size="small" color={Theme.colors.primary} />
                  ) : (
                    <Text style={[styles.smsBtnText, countdown > 0 && styles.smsBtnTextDisabled]}>
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 密码 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>密码</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="8-20位，包含字母和数字"
                  secureTextEntry={!showPassword}
                  maxLength={20}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 确认密码 */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>确认密码</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入密码"
                  secureTextEntry={!showPassword}
                  maxLength={20}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
          </View>

          {/* 用户协议 */}
          <TouchableOpacity
            style={styles.agreement}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text style={styles.agreementText}>
              我已阅读并同意
              <Text style={styles.linkText}>《用户协议》</Text>
              和
              <Text style={styles.linkText}>《隐私政策》</Text>
            </Text>
          </TouchableOpacity>

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[styles.registerBtn, isLoading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerBtnText}>注册</Text>
            )}
          </TouchableOpacity>

          {/* 登录入口 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>已有账号？</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>立即登录</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Theme.spacing.section,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },

  inputContainer: {
    gap: Theme.spacing.page,
  },
  inputWrapper: {
    gap: Theme.spacing.sm,
  },
  inputLabel: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    fontWeight: Theme.typography.weights.medium,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.content,
    height: 52,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  prefix: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    marginRight: Theme.spacing.sm,
    paddingRight: Theme.spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.border,
  },
  input: {
    flex: 1,
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
  },
  smsBtn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
  },
  smsBtnDisabled: {
    opacity: 0.6,
  },
  smsBtnText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  smsBtnTextDisabled: {
    color: Theme.colors.textMuted,
  },
  agreement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.section,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Theme.radius.xxs,
    borderWidth: 2,
    borderColor: Theme.colors.textMuted,
    marginRight: Theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  agreementText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textSecondary,
    flex: 1,
  },
  linkText: {
    color: Theme.colors.primary,
  },
  registerBtn: {
    backgroundColor: Theme.colors.primary,
    height: 52,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xxl,
    ...Theme.shadows.button,
  },
  registerBtnDisabled: {
    opacity: 0.7,
  },
  registerBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.section,
    gap: Theme.spacing.xs,
  },
  footerText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
});

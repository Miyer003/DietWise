import React, { useState, useEffect } from 'react';
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

type LoginMode = 'password' | 'sms';

export default function LoginScreen({ navigation, route }: any) {
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginBySms } = useAuth();

  // 接收从注册页传递的参数
  useEffect(() => {
    if (route.params?.phone) {
      setPhone(route.params.phone);
    }
    if (route.params?.password) {
      setPassword(route.params.password);
    }
  }, [route.params]);

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
        const { code, expireIn } = response.data || {};
        
        // 开发环境显示验证码弹窗
        if (code) {
          Alert.alert(
            '验证码已发送（开发模式）',
            `验证码: ${code}\n有效期: ${expireIn}秒`,
            [
              { 
                text: '复制并填入', 
                onPress: () => {
                  setSmsCode(code);
                }
              },
              { text: '知道了', style: 'cancel' }
            ]
          );
        } else {
          Alert.alert('成功', '验证码已发送');
        }
        
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
      Alert.alert('错误', error.message || '发送失败，请稍后重试');
    } finally {
      setIsSendingSms(false);
    }
  };

  // 处理登录
  const handleLogin = async () => {
    if (!phone || phone.length !== 11) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    if (mode === 'password' && !password) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    if (mode === 'sms' && !smsCode) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'password') {
        await login(phone, password);
      } else {
        await loginBySms(phone, smsCode);
      }
      // 登录成功，导航器会自动切换到主界面
    } catch (error: any) {
      Alert.alert('登录失败', error.message || '请检查账号密码');
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
          <ScreenHeader title="欢迎回来" subtitle="登录您的账号" />

          {/* Logo 区域 */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="leaf" size={50} color={Theme.colors.primary} />
            </View>
            <Text style={styles.appName}>膳智 DietWise</Text>
            <Text style={styles.slogan}>智能饮食健康管理</Text>
          </View>

          {/* 登录方式切换 */}
          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
              onPress={() => setMode('password')}
            >
              <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive]}>
                密码登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'sms' && styles.modeBtnActive]}
              onPress={() => setMode('sms')}
            >
              <Text style={[styles.modeText, mode === 'sms' && styles.modeTextActive]}>
                验证码登录
              </Text>
            </TouchableOpacity>
          </View>

          {/* 输入区域 */}
          <View style={styles.inputContainer}>
            {/* 手机号输入 */}
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

            {/* 密码/验证码输入 */}
            {mode === 'password' ? (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>密码</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入密码"
                    secureTextEntry={!showPassword}
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
            ) : (
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
            )}
          </View>

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginBtnText}>登录</Text>
            )}
          </TouchableOpacity>

          {/* 底部选项 */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerText}>注册账号</Text>
            </TouchableOpacity>
            {mode === 'password' && (
              <TouchableOpacity>
                <Text style={styles.footerText}>忘记密码？</Text>
              </TouchableOpacity>
            )}
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
    padding: Theme.spacing.page + 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: Theme.colors.highlight,
    borderRadius: Theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    ...Theme.shadows.card,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: 8,
  },
  slogan: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.md,
    padding: 4,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Theme.radius.xs,
  },
  modeBtnActive: {
    backgroundColor: Theme.colors.card,
    ...Theme.shadows.search,
  },
  modeText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  modeTextActive: {
    color: Theme.colors.primary,
  },
  inputContainer: {
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.text,
    fontWeight: '500',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  prefix: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text,
  },
  smsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smsBtnDisabled: {
    opacity: 0.6,
  },
  smsBtnText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  smsBtnTextDisabled: {
    color: Theme.colors.textMuted,
  },
  loginBtn: {
    backgroundColor: Theme.colors.primary,
    height: 48,
    borderRadius: Theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    ...Theme.shadows.button,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: Theme.colors.textInverse,
    fontSize: 16,
    fontWeight: Theme.typography.weights.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  footerText: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.primary,
  },
});

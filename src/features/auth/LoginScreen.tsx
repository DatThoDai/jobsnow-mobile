import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { useAuthStore } from '../../stores/useAuthStore';
import { authService } from '../../services/api/authService';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginRoute = RouteProp<AuthStackParamList, 'Login'>;

type LoginStep = 'login-otp' | 'login-password';

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRoute>();
  const email = route.params.email;
  const otpSent = route.params.otpSent ?? false;

  const [step, setStep] = useState<LoginStep>(otpSent ? 'login-otp' : 'login-password');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    otpSent ? 'Mã OTP đã được gửi đến email của bạn!' : null
  );
  const [resendCooldown, setResendCooldown] = useState(otpSent ? 60 : 0);

  const { login, loginByOtp } = useAuthStore();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('OTP phải là 6 chữ số');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await loginByOtp(email, otp);
    } catch (e: any) {
      setError(e.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPassword = async () => {
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.sendLoginOtp(email);
      setResendCooldown(60);
      setSuccessMsg('Đã gửi lại mã OTP!');
    } catch (e: any) {
      setError(e.message || 'Gửi lại OTP thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToPassword = () => {
    setStep('login-password');
    setError(null);
    setSuccessMsg(null);
    setOtp('');
  };

  const switchToOtp = () => {
    setStep('login-otp');
    setError(null);
    setSuccessMsg(null);
    setPassword('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.background, colors.surfaceAlt]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={colors.textPrimary} size={24} />
          </Pressable>

          <View style={styles.centeredContent}>
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Feather name="lock" color={colors.primary} size={24} />
              </View>
              <AppText variant="h1" style={styles.title}>
                {step === 'login-otp' ? 'Xác thực OTP' : 'Đăng nhập'}
              </AppText>
              <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                Tài khoản: <AppText variant="body" style={{ fontWeight: '700', color: colors.textPrimary }}>{email}</AppText>
              </AppText>
            </View>

            <View style={styles.formCard}>
              {successMsg && (
                <View style={styles.successBox}>
                  <Feather name="check-circle" color="#16A34A" size={16} />
                  <AppText variant="caption" style={{ color: '#16A34A', flex: 1 }}>{successMsg}</AppText>
                </View>
              )}

              {error && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" color={colors.error} size={16} />
                  <AppText variant="caption" color="error" style={{ flex: 1 }}>{error}</AppText>
                </View>
              )}

              {step === 'login-otp' && (
                <>
                  <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>MÃ OTP (6 CHỮ SỐ)</AppText>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="000000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>

                  <Pressable
                    onPress={handleResendOtp}
                    disabled={isLoading || resendCooldown > 0}
                    style={styles.resendRow}
                  >
                    <AppText variant="caption" color={resendCooldown > 0 ? 'textMuted' : 'primary'}>
                      {resendCooldown > 0 ? `Gửi lại mã sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
                    </AppText>
                  </Pressable>

                  <View style={styles.actions}>
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="large" />
                    ) : (
                      <PrimaryButton title="Xác thực & Đăng nhập" onPress={handleVerifyOtp} disabled={otp.length !== 6} />
                    )}
                  </View>

                  <Pressable onPress={switchToPassword} style={styles.switchMethod}>
                    <AppText variant="bodySm" color="textSecondary">Đăng nhập bằng mật khẩu</AppText>
                  </Pressable>
                </>
              )}

              {step === 'login-password' && (
                <>
                  <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>MẬT KHẨU</AppText>
                    <View style={styles.inputWrapper}>
                      <Feather name="key" color={colors.textMuted} size={18} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        placeholder="Nhập mật khẩu"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.actions}>
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="large" />
                    ) : (
                      <PrimaryButton title="Đăng nhập" onPress={handleLoginPassword} disabled={!password} />
                    )}
                  </View>

                  <Pressable onPress={switchToOtp} style={styles.switchMethod}>
                    <AppText variant="bodySm" color="textSecondary">Dùng mã OTP qua Email</AppText>
                  </Pressable>
                </>
              )}
            </View>

            <View style={styles.footer}>
              <AppText variant="caption" color="textMuted">
                Bằng cách đăng nhập, bạn đồng ý với các Điều khoản & Chính sách của JobsNow
              </AppText>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm, marginTop: 60, marginBottom: spacing.xl,
  },
  centeredContent: {
    flex: 1, justifyContent: 'center',
    paddingBottom: 60,
  },
  header: { alignItems: 'center', marginBottom: spacing['2xl'] },
  logoBadge: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 32, marginBottom: 8 },
  subtitle: { textAlign: 'center' },
  formCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius['2xl'],
    gap: spacing.lg,
    ...shadows.xl,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: spacing.md, backgroundColor: '#DCFCE7',
    borderRadius: radius.lg, borderWidth: 1, borderColor: '#BBF7D0',
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: spacing.md, backgroundColor: '#FEE2E2',
    borderRadius: radius.lg, borderWidth: 1, borderColor: '#FCA5A5',
  },
  inputGroup: { gap: spacing.xs },
  label: {
    textTransform: 'uppercase', fontFamily: fontFamilies.display,
    letterSpacing: 0.8, color: colors.textSecondary, fontSize: 11,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  inputWithIcon: { flex: 1, fontFamily: fontFamilies.body, fontSize: 16, color: colors.textPrimary },
  input: {
    height: 56, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body, fontSize: 16, color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  otpInput: {
    textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '700',
    color: colors.primary,
  },
  resendRow: { alignSelf: 'center' },
  actions: { marginTop: spacing.sm },
  switchMethod: {
    alignItems: 'center', paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  footer: { marginTop: spacing.xl, paddingHorizontal: spacing.xl },
});

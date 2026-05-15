import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { authService } from '../../services/api/authService';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterRoute = RouteProp<AuthStackParamList, 'Register'>;

type RegisterStep = 'form' | 'verify-otp';

export function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterRoute>();
  const email = route.params.email;

  const [roleName, setRoleName] = useState<'ROLE_JOBSEEKER' | 'ROLE_COMPANY'>('ROLE_JOBSEEKER');
  const [companyName, setCompanyName] = useState('');
  const [step, setStep] = useState<RegisterStep>('form');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (roleName === 'ROLE_JOBSEEKER' && fullName.length < 2) { setError('Họ tên phải có ít nhất 2 ký tự'); return false; }
    if (roleName === 'ROLE_COMPANY' && companyName.length < 2) { setError('Tên công ty phải có ít nhất 2 ký tự'); return false; }
    if (password.length < 6 || password.length > 20) { setError('Mật khẩu phải có 6-20 ký tự'); return false; }
    const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!pwRegex.test(password)) { setError('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số'); return false; }
    if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return false; }
    if (phone && !/^[0-9]{10,11}$/.test(phone)) { setError('Số điện thoại phải 10-11 số'); return false; }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.register({
        email,
        password,
        fullName: roleName === 'ROLE_JOBSEEKER' ? fullName : undefined,
        companyName: roleName === 'ROLE_COMPANY' ? companyName : undefined,
        phone: phone || undefined,
        roleName,
      });

      if (roleName === 'ROLE_COMPANY') {
        setStep('verify-otp');
        Alert.alert('Xác thực OTP', 'Mã OTP đã được gửi đến email của bạn.');
      } else {
        Alert.alert('Thành công', 'Đăng ký thành công! Hãy đăng nhập.', [
          { text: 'OK', onPress: () => navigation.navigate('Login', { email }) }
        ]);
      }
    } catch (e: any) {
      setError(e.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('OTP phải là 6 chữ số'); return; }
    setError(null);
    setIsLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      Alert.alert('Thành công', 'Xác thực tài khoản doanh nghiệp thành công!', [
        { text: 'OK', onPress: () => navigation.navigate('Login', { email }) }
      ]);
    } catch (e: any) {
      setError(e.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      await authService.resendOtp(email);
      Alert.alert('Thông báo', 'Đã gửi lại mã OTP mới!');
    } catch (e: any) {
      setError(e.message || 'Gửi lại OTP thất bại');
    }
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
              <AppText variant="h1" style={styles.title}>
                {step === 'form' ? 'Tạo tài khoản' : 'Xác thực Email'}
              </AppText>
              <AppText variant="body" color="textSecondary" style={styles.subtitle}>
                {step === 'form' ? 'Gia nhập cộng đồng ' : 'Mã OTP đã gửi tới '}
                <AppText variant="body" style={{ fontWeight: '700', color: colors.textPrimary }}>{email}</AppText>
              </AppText>
            </View>

            <View style={styles.formCard}>
              {error && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" color={colors.error} size={16} />
                  <AppText variant="caption" color="error" style={{ flex: 1 }}>{error}</AppText>
                </View>
              )}

              {step === 'form' ? (
                <>
                  <View style={styles.roleContainer}>
                    <Pressable 
                      style={[styles.roleBtn, roleName === 'ROLE_JOBSEEKER' && styles.roleBtnActive]}
                      onPress={() => setRoleName('ROLE_JOBSEEKER')}
                    >
                      <View style={[styles.roleIcon, roleName === 'ROLE_JOBSEEKER' && styles.roleIconActive]}>
                        <Feather name="user" color={roleName === 'ROLE_JOBSEEKER' ? colors.white : colors.textMuted} size={18} />
                      </View>
                      <AppText variant="caption" style={roleName === 'ROLE_JOBSEEKER' ? styles.roleTextActive : styles.roleText}>ỨNG VIÊN</AppText>
                    </Pressable>
                    <Pressable 
                      style={[styles.roleBtn, roleName === 'ROLE_COMPANY' && styles.roleBtnActive]}
                      onPress={() => setRoleName('ROLE_COMPANY')}
                    >
                      <View style={[styles.roleIcon, roleName === 'ROLE_COMPANY' && styles.roleIconActive]}>
                        <Feather name="briefcase" color={roleName === 'ROLE_COMPANY' ? colors.white : colors.textMuted} size={18} />
                      </View>
                      <AppText variant="caption" style={roleName === 'ROLE_COMPANY' ? styles.roleTextActive : styles.roleText}>DOANH NGHIỆP</AppText>
                    </Pressable>
                  </View>

                  {roleName === 'ROLE_JOBSEEKER' ? (
                    <View style={styles.inputGroup}>
                      <AppText variant="caption" style={styles.label}>HỌ VÀ TÊN *</AppText>
                      <View style={styles.inputWrapper}>
                        <Feather name="user" color={colors.textMuted} size={18} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputWithIcon}
                          placeholder="Nhập họ và tên"
                          placeholderTextColor={colors.textMuted}
                          value={fullName}
                          onChangeText={setFullName}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.inputGroup}>
                      <AppText variant="caption" style={styles.label}>TÊN CÔNG TY *</AppText>
                      <View style={styles.inputWrapper}>
                        <Feather name="home" color={colors.textMuted} size={18} style={styles.inputIcon} />
                        <TextInput
                          style={styles.inputWithIcon}
                          placeholder="Nhập tên công ty"
                          placeholderTextColor={colors.textMuted}
                          value={companyName}
                          onChangeText={setCompanyName}
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>SỐ ĐIỆN THOẠI</AppText>
                    <View style={styles.inputWrapper}>
                      <Feather name="phone" color={colors.textMuted} size={18} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        placeholder="VD: 0901234567"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>MẬT KHẨU *</AppText>
                    <View style={styles.inputWrapper}>
                      <Feather name="lock" color={colors.textMuted} size={18} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        placeholder="Mật khẩu bảo mật"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>XÁC NHẬN MẬT KHẨU *</AppText>
                    <View style={styles.inputWrapper}>
                      <Feather name="shield" color={colors.textMuted} size={18} style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputWithIcon}
                        placeholder="Nhập lại mật khẩu"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.actions}>
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="large" />
                    ) : (
                      <PrimaryButton title="Hoàn tất đăng ký" onPress={handleRegister} />
                    )}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <AppText variant="caption" style={styles.label}>MÃ OTP (6 SỐ)</AppText>
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

                  <Pressable onPress={handleResendOtp} style={styles.resendRow}>
                    <AppText variant="caption" color="primary">Gửi lại mã OTP</AppText>
                  </Pressable>

                  <View style={styles.actions}>
                    {isLoading ? (
                      <ActivityIndicator color={colors.primary} size="large" />
                    ) : (
                      <PrimaryButton title="Xác thực tài khoản" onPress={handleVerifyOtp} disabled={otp.length !== 6} />
                    )}
                  </View>

                  <Pressable onPress={() => setStep('form')} style={styles.switchMethod}>
                    <AppText variant="bodySm" color="textSecondary">Quay lại thông tin đăng ký</AppText>
                  </Pressable>
                </>
              )}
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
  centeredContent: { flex: 1, justifyContent: 'center', paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
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
  roleContainer: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
  roleBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, gap: 8,
  },
  roleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIconActive: { backgroundColor: colors.primary },
  roleText: { color: colors.textSecondary, fontWeight: '600', fontSize: 10, letterSpacing: 0.5 },
  roleTextActive: { color: colors.primary, fontWeight: '700', fontSize: 10, letterSpacing: 0.5 },
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
    height: 52, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  inputWithIcon: { flex: 1, fontFamily: fontFamilies.body, fontSize: 15, color: colors.textPrimary },
  input: {
    height: 52, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body, fontSize: 15, color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  otpInput: {
    textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '700',
    color: colors.primary, height: 60,
  },
  resendRow: { alignSelf: 'center' },
  actions: { marginTop: spacing.sm },
  switchMethod: {
    alignItems: 'center', paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
});

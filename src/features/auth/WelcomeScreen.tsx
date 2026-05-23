import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { authService } from '../../services/api/authService';
import { useAuthStore } from '../../stores/useAuthStore';
import { ENABLE_SOCIAL_OAUTH } from '../../config/env';
import { SocialOAuthSection } from './SocialOAuthSection';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
const { width } = Dimensions.get('window');

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { isLoading: authLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const exists = await authService.checkEmail(email.trim());
      if (exists) {
        let otpSent = false;
        try {
          await authService.sendLoginOtp(email.trim());
          otpSent = true;
        } catch {
          // fall back to password login
        }
        navigation.navigate('Login', { email: email.trim(), otpSent });
      } else {
        navigation.navigate('Register', { email: email.trim() });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Đã xảy ra lỗi khi kiểm tra email');
    } finally {
      setIsLoading(false);
    }
  };

  const busy = isLoading || authLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <LinearGradient colors={[colors.background, colors.surfaceAlt]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.hero}>
            <Image
              source={require('../../../assets/logo_full.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.actionCard}>
            <AppText variant="h3" style={styles.cardTitle}>Đăng nhập hoặc Đăng ký</AppText>

            {error && (
              <View style={styles.errorBox}>
                <AppText variant="caption" color="error">{error}</AppText>
              </View>
            )}

            <View style={styles.inputGroup}>
              <AppText variant="caption" style={styles.label}>EMAIL</AppText>
              <TextInput
                style={styles.input}
                placeholder="Nhập email của bạn"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!busy}
              />
            </View>

            <Pressable
              style={[styles.btn, styles.btnPrimary, (!email.trim() || busy) && styles.btnDisabled]}
              onPress={handleContinue}
              disabled={!email.trim() || busy}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppText variant="label" color="white">Tiếp tục</AppText>
              )}
            </Pressable>

            {ENABLE_SOCIAL_OAUTH ? (
              <SocialOAuthSection busy={busy} onError={setError} />
            ) : null}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-end',
    gap: spacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginTop: spacing.xl,
  },
  logo: { width: width * 0.65, height: 90 },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardTitle: { textAlign: 'center', marginBottom: spacing.xs },
  errorBox: {
    padding: spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  inputGroup: { gap: spacing.xs },
  label: {
    textTransform: 'uppercase',
    fontFamily: fontFamilies.display,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.pill,
  },
  btnPrimary: { backgroundColor: colors.primary, ...shadows.md },
  btnDisabled: { opacity: 0.5 },
});

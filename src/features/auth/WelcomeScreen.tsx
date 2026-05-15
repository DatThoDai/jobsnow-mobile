import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Image, Dimensions, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { authService } from '../../services/api/authService';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
const { width } = Dimensions.get('window');

export function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
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
        } catch (e: any) {
          console.warn('Gửi OTP thất bại, chuyển sang mật khẩu', e);
        }
        navigation.navigate('Login', { email: email.trim(), otpSent });
      } else {
        navigation.navigate('Register', { email: email.trim() });
      }
    } catch (e: any) {
      setError(e.message || 'Đã xảy ra lỗi khi kiểm tra email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.surfaceAlt]}
        style={styles.gradient}
      >
        <View style={styles.content}>
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
                editable={!isLoading}
              />
            </View>

            <Pressable
              style={[styles.btn, styles.btnPrimary, (!email.trim() || isLoading) && styles.btnDisabled]}
              onPress={handleContinue}
              disabled={!email.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppText variant="label" color="white">Tiếp tục</AppText>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.line} />
              <AppText variant="caption" color="textMuted">HOẶC</AppText>
              <View style={styles.line} />
            </View>

            <Pressable style={[styles.btn, styles.btnLinkedin]} onPress={() => Alert.alert('Đang phát triển', 'Đang kết nối API OAuth2 của LinkedIn')}>
              <Feather name="linkedin" color={colors.white} size={20} />
              <AppText variant="label" color="white">Đăng nhập bằng LinkedIn</AppText>
            </Pressable>

            <Pressable style={[styles.btn, styles.btnGoogle]} onPress={() => Alert.alert('Đang phát triển', 'Đang kết nối API OAuth2 của Google')}>
              <Feather name="mail" color={colors.textPrimary} size={20} />
              <AppText variant="label" color="textPrimary">Đăng nhập bằng Google</AppText>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: width * 0.65,
    height: 90,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  errorBox: {
    padding: spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  inputGroup: {
    gap: spacing.xs,
  },
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
  btnPrimary: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  btnLinkedin: {
    backgroundColor: '#0077B5',
  },
  btnGoogle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
});

import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing } from '../../theme';
import { useAuthStore } from '../../stores/useAuthStore';
import { oauthStorage } from '../../services/oauthStorage';
import { buildLinkedInAuthUrl, parseLinkedInCallback } from '../../utils/deepLinks';
import { hasGoogleAuth, hasLinkedInAuth, getLinkedInRedirectUri } from '../../config/env';
import {
  configureGoogleSignIn,
  GoogleSignInCancelledError,
  isGoogleNativeSignInAvailable,
  resolveGoogleSignInError,
  signInWithGoogleNative,
} from './googleSignIn';

WebBrowser.maybeCompleteAuthSession();

interface SocialOAuthSectionProps {
  busy: boolean;
  onError: (message: string) => void;
}

export function SocialOAuthSection({ busy, onError }: SocialOAuthSectionProps) {
  const { loginWithGoogle, loginWithLinkedIn, isLoading: authLoading } = useAuthStore();
  const [oauthLoading, setOauthLoading] = useState<'google' | 'linkedin' | null>(null);

  useEffect(() => {
    if (isGoogleNativeSignInAvailable()) {
      configureGoogleSignIn();
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Thông báo',
        'Đăng nhập Google trên iOS sẽ được bổ sung sau. Hiện tại vui lòng dùng email hoặc LinkedIn.'
      );
      return;
    }

    if (!isGoogleNativeSignInAvailable()) {
      Alert.alert(
        'Cấu hình',
        'Chưa cấu hình Google OAuth. Thêm googleWebClientId (Web client) vào app.json extra, và SHA-1 EAS trên Google Cloud.'
      );
      return;
    }

    if (!hasGoogleAuth()) {
      Alert.alert('Cấu hình', 'Chưa cấu hình Google OAuth.');
      return;
    }

    setOauthLoading('google');
    try {
      const idToken = await signInWithGoogleNative();
      await loginWithGoogle(idToken);
    } catch (e: unknown) {
      if (e instanceof GoogleSignInCancelledError) {
        return;
      }
      onError(resolveGoogleSignInError(e));
    } finally {
      setOauthLoading(null);
    }
  };

  const handleLinkedInLogin = async () => {
    const linkedInRedirectUri = getLinkedInRedirectUri();
    if (!hasLinkedInAuth()) {
      Alert.alert('Cấu hình', 'Chưa cấu hình LinkedIn OAuth. Thêm linkedinClientId vào app.json extra.');
      return;
    }
    setOauthLoading('linkedin');
    try {
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}-${Math.random()}`
      );
      await oauthStorage.saveLinkedInSession(state, 'ROLE_JOBSEEKER', linkedInRedirectUri);
      const authUrl = buildLinkedInAuthUrl(state);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, linkedInRedirectUri);
      if (result.type === 'success' && result.url) {
        const parsed = parseLinkedInCallback(result.url);
        if (parsed?.error) {
          onError('Bạn đã từ chối quyền đăng nhập LinkedIn');
          await oauthStorage.clearLinkedInSession();
          return;
        }
        if (parsed?.code && parsed.state === state) {
          await loginWithLinkedIn(parsed.code, linkedInRedirectUri);
          await oauthStorage.clearLinkedInSession();
        } else {
          onError('Phiên đăng nhập LinkedIn không hợp lệ');
          await oauthStorage.clearLinkedInSession();
        }
      } else if (result.type === 'dismiss' || result.type === 'cancel') {
        const session = await oauthStorage.getLinkedInSession();
        if (session.state) {
          return;
        }
      }
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Đăng nhập LinkedIn thất bại');
      await oauthStorage.clearLinkedInSession();
    } finally {
      WebBrowser.dismissAuthSession();
      setOauthLoading(null);
    }
  };

  const oauthBusy = busy || authLoading || oauthLoading !== null;
  const googleEnabled = Platform.OS === 'android' ? isGoogleNativeSignInAvailable() : false;

  return (
    <>
      <View style={styles.divider}>
        <View style={styles.line} />
        <AppText variant="caption" color="textMuted">HOẶC</AppText>
        <View style={styles.line} />
      </View>

      <Pressable
        style={[styles.btn, styles.btnGoogle, oauthBusy && styles.btnDisabled]}
        onPress={handleGoogleLogin}
        disabled={oauthBusy || !googleEnabled}
      >
        {oauthLoading === 'google' ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <>
            <Feather name="mail" color={colors.textPrimary} size={20} />
            <AppText variant="label" color="textPrimary">Đăng nhập bằng Google</AppText>
          </>
        )}
      </Pressable>

      <Pressable
        style={[styles.btn, styles.btnLinkedin, oauthBusy && styles.btnDisabled]}
        onPress={handleLinkedInLogin}
        disabled={oauthBusy}
      >
        {oauthLoading === 'linkedin' ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Feather name="linkedin" color={colors.white} size={20} />
            <AppText variant="label" color="white">Đăng nhập bằng LinkedIn</AppText>
          </>
        )}
      </Pressable>

      <AppText variant="caption" color="textMuted" style={styles.linkedinHint}>
        LinkedIn sẽ mở trình duyệt an toàn của hệ thống để xác thực.
      </AppText>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.pill,
  },
  btnLinkedin: { backgroundColor: '#0077B5' },
  btnGoogle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  linkedinHint: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { colors, spacing } from '../../theme';
import { PUBLIC_SITE_URL } from '../../config/env';
import { authStorage } from '../../services/authStorage';

export function CVBuilderWebViewScreen() {
  const navigation = useNavigation();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [webError, setWebError] = useState(false);

  useEffect(() => {
    authStorage.getSession().then((s) => {
      setToken(s?.token ?? null);
      setLoading(false);
    });
  }, []);

  const builderUrl = `${PUBLIC_SITE_URL}/tools/tao-cv/builder`;
  const injectedBefore = token
    ? `(function(){
        try {
          localStorage.setItem('token',${JSON.stringify(token)});
          localStorage.setItem('accessToken',${JSON.stringify(token)});
        } catch(e) {}
      })();true;`
    : 'true;';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <AppText variant="h3">Tạo CV trực tuyến</AppText>
        <View style={{ width: 40 }} />
      </View>
      {!token && !loading ? (
        <View style={styles.center}>
          <Feather name="lock" size={40} color={colors.textMuted} />
          <AppText variant="body" color="textMuted" style={{ marginTop: spacing.md, textAlign: 'center' }}>
            Vui lòng đăng nhập để sử dụng trình tạo CV trực tuyến.
          </AppText>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : webError ? (
        <View style={styles.center}>
          <AppText variant="body" color="textMuted" style={{ textAlign: 'center' }}>
            Không thể tải trình tạo CV. Kiểm tra kết nối mạng và thử lại.
          </AppText>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setWebError(false);
              setLoading(true);
              setTimeout(() => setLoading(false), 300);
            }}
          >
            <AppText variant="body" color="primary" style={{ fontWeight: '700' }}>
              Thử lại
            </AppText>
          </Pressable>
        </View>
      ) : (
        <WebView
          source={{ uri: builderUrl }}
          injectedJavaScriptBeforeContentLoaded={injectedBefore}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          onError={() => setWebError(true)}
          onHttpError={() => setWebError(true)}
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          style={styles.webview}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  retryBtn: { marginTop: spacing.lg, padding: spacing.md },
});

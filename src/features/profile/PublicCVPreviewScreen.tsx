import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import {colors, radius, spacing, zIndex } from '../../theme';

import { API_BASE_URL, PUBLIC_SITE_URL } from '../../config/env';
import { profileService } from '../../services/api/profileService';
import { resumeService } from '../../services/api/resumeService';
import { authStorage } from '../../services/authStorage';
import { RootStackParamList } from '../../navigation/RootNavigator';
import type { Resume } from '../../services/api/models';
import { downloadAndSharePdf, safePdfFilename } from '../../utils/downloadAndShareFile';
import { CV_EXPORT_HTML_INJECT, printHtmlToPdfAndShare } from '../../utils/exportCvPdf';
import { getApiErrorMessage } from '../../utils/apiError';

type ViewMode = 'web' | 'pdf';

const MOBILE_VIEWPORT_INJECT = (token: string | null) =>
  `(function(){
    try {
      var t=${JSON.stringify(token)};
      if (t) {
        localStorage.setItem('token', t);
        localStorage.setItem('accessToken', t);
      }
    } catch(e) {}
    var m=document.querySelector('meta[name="viewport"]');
    if (!m) {
      m=document.createElement('meta');
      m.name='viewport';
      document.head.appendChild(m);
    }
    m.content='width=device-width, initial-scale=1';
  })();true;`;

const MOBILE_CV_LAYOUT_INJECT = `
(function(){
  if (document.querySelector('[data-public-cv-scaler="true"]')) {
    document.documentElement.style.overflowX='hidden';
    return true;
  }
  function hideDownloadButtons() {
    document.querySelectorAll('button').forEach(function(btn) {
      var txt=(btn.textContent||'').trim();
      if (/tải|download|pdf/i.test(txt)) {
        var row=btn.parentElement;
        if (row) row.style.display='none';
      }
    });
  }
  function fitCv() {
    var root=document.querySelector('[data-cv-root="true"]');
    if (!root) return false;
    hideDownloadButtons();
    var pad=12;
    var pageW=root.getBoundingClientRect().width||root.offsetWidth;
    if (!pageW||pageW<10) return false;
    var vw=window.innerWidth-pad*2;
    var scale=Math.min(1,vw/pageW);
    root.style.transform='scale('+scale+')';
    root.style.transformOrigin='top center';
    root.style.marginLeft='auto';
    root.style.marginRight='auto';
    var outer=root.parentElement;
    if (outer) {
      outer.style.width='100%';
      outer.style.overflow='hidden';
      outer.style.display='flex';
      outer.style.justifyContent='center';
      outer.style.minHeight=Math.ceil(root.getBoundingClientRect().height)+'px';
    }
    var shell=root.closest('.min-h-screen');
    if (shell) {
      shell.style.paddingTop='8px';
      shell.style.paddingBottom='12px';
    }
    document.documentElement.style.overflowX='hidden';
    return true;
  }
  var n=0;
  function retry() {
    if (fitCv()||n++>40) return;
    setTimeout(retry,250);
  }
  if (document.readyState==='complete') retry();
  else window.addEventListener('load', retry);
  retry();
})();
true;
`;

function buildPublicCvUrl(profileId: number, resumeId?: number): string {
  const params = new URLSearchParams({ embed: 'mobile' });
  if (resumeId != null) {
    params.set('resumeId', String(resumeId));
  }
  const base = PUBLIC_SITE_URL.replace(/\/+$/, '');
  return `${base}/cv/${profileId}?${params.toString()}`;
}

function toAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE_URL.replace(/\/$/, '');
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

function pickTargetResume(resumes: Resume[], resumeId?: number): Resume | null {
  if (!resumes?.length) return null;
  if (resumeId) {
    const found = resumes.find((r) => r.resumeId === resumeId);
    if (found) return found;
  }
  return resumes.find((r) => r.isPrimary) ?? resumes[0];
}

export function PublicCVPreviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PublicCVPreview'>>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const { profileId, resumeId } = route.params;
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [targetResume, setTargetResume] = useState<Resume | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('web');
  const [webError, setWebError] = useState(false);
  const [webReady, setWebReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportPendingRef = useRef(false);
  const exportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileUrl = targetResume?.fileUrl || targetResume?.resumeUrl;
  const absoluteFileUrl = fileUrl ? toAbsoluteUrl(String(fileUrl)) : null;
  const hasParsedCv = Boolean(targetResume?.hasParsedCv);
  const canShowPdf = Boolean(absoluteFileUrl);
  const canShowWeb = hasParsedCv || !canShowPdf;

  useEffect(() => {
    Promise.all([
      profileService.getProfileById(profileId).then((p) => setProfileName(p.fullName || '')),
      authStorage.getSession().then((s) => setToken(s?.token ?? null)),
      resumeService
        .getResumesByProfile(profileId)
        .then((resumes) => {
          const target = pickTargetResume(resumes, resumeId);
          setTargetResume(target);
          const file = target?.fileUrl || target?.resumeUrl;
          const parsed = Boolean(target?.hasParsedCv);
          if (file && !parsed) {
            setViewMode('pdf');
          } else {
            setViewMode('web');
          }
        })
        .catch(() => setTargetResume(null)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileId, resumeId]);

  const cvUrl = buildPublicCvUrl(profileId, resumeId);
  const cvUrlDesktop = resumeId
    ? `${PUBLIC_SITE_URL.replace(/\/+$/, '')}/cv/${profileId}?resumeId=${resumeId}`
    : `${PUBLIC_SITE_URL.replace(/\/+$/, '')}/cv/${profileId}`;

  const layoutRetryTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearLayoutRetries = useCallback(() => {
    layoutRetryTimers.current.forEach(clearTimeout);
    layoutRetryTimers.current = [];
  }, []);

  const applyMobileLayout = useCallback(() => {
    webViewRef.current?.injectJavaScript(MOBILE_CV_LAYOUT_INJECT);
  }, []);

  const scheduleMobileLayoutRetries = useCallback(() => {
    clearLayoutRetries();
    const delays = [0, 300, 800, 1500, 2500, 4000];
    layoutRetryTimers.current = delays.map((ms) =>
      setTimeout(() => applyMobileLayout(), ms)
    );
  }, [applyMobileLayout, clearLayoutRetries]);

  useEffect(() => () => clearLayoutRetries(), [clearLayoutRetries]);

  const finishExport = useCallback(() => {
    exportPendingRef.current = false;
    if (exportTimeoutRef.current) {
      clearTimeout(exportTimeoutRef.current);
      exportTimeoutRef.current = null;
    }
    setExporting(false);
  }, []);

  const runTemplatePdfExport = useCallback(
    async (html: string) => {
      try {
        await printHtmlToPdfAndShare(html);
      } catch (e) {
        Alert.alert('Lỗi', getApiErrorMessage(e, 'Không thể tạo file PDF.'));
      } finally {
        finishExport();
      }
    },
    [finishExport]
  );

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          html?: string;
          message?: string;
        };
        if (payload.type === 'cv-ready') {
          applyMobileLayout();
          return;
        }
        if (payload.type === 'cv-export-html' && typeof payload.html === 'string') {
          void runTemplatePdfExport(payload.html);
          return;
        }
        if (payload.type === 'cv-export-error' && exportPendingRef.current) {
          finishExport();
          Alert.alert(
            'Lỗi',
            payload.message || 'Không thể xuất PDF. Hãy đợi CV tải xong rồi thử lại.'
          );
        }
      } catch {
        // ignore non-JSON messages
      }
    },
    [applyMobileLayout, finishExport, runTemplatePdfExport]
  );

  const openInBrowser = () => {
    const url = viewMode === 'pdf' && absoluteFileUrl ? absoluteFileUrl : cvUrlDesktop;
    Linking.openURL(url).catch(() => {});
  };

  const downloadFilePdf = useCallback(async () => {
    if (!absoluteFileUrl) return;
    setExporting(true);
    try {
      const session = token ? { token } : await authStorage.getSession();
      const authHeader = session?.token ? { Authorization: `Bearer ${session.token}` } : undefined;
      const name =
        targetResume?.resumeName ||
        targetResume?.title ||
        profileName ||
        'CV';
      await downloadAndSharePdf(
        absoluteFileUrl,
        safePdfFilename(String(name)),
        authHeader
      );
    } catch (e) {
      Alert.alert('Lỗi', getApiErrorMessage(e, 'Không thể tải file PDF.'));
    } finally {
      setExporting(false);
    }
  }, [absoluteFileUrl, profileName, targetResume, token]);

  const exportTemplatePdf = useCallback(() => {
    if (!webReady) {
      Alert.alert('Đang tải', 'Vui lòng đợi CV hiển thị xong rồi thử lại.');
      return;
    }
    exportPendingRef.current = true;
    setExporting(true);
    if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current);
    webViewRef.current?.injectJavaScript(CV_EXPORT_HTML_INJECT);
    exportTimeoutRef.current = setTimeout(() => {
      if (!exportPendingRef.current) return;
      finishExport();
      Alert.alert('Lỗi', 'Không thể xuất PDF. Vui lòng thử lại.');
    }, 15000);
  }, [finishExport, webReady]);

  const handlePrimaryAction = () => {
    if (exporting) return;
    if (viewMode === 'pdf' || (absoluteFileUrl && !hasParsedCv)) {
      void downloadFilePdf();
      return;
    }
    exportTemplatePdf();
  };

  const primaryActionReady = viewMode === 'pdf' ? Boolean(absoluteFileUrl) : webReady;
  const primaryActionLabel = 'Tải PDF';

  const webSourceUri = viewMode === 'pdf' && absoluteFileUrl ? absoluteFileUrl : cvUrl;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText variant="h3" numberOfLines={1}>
            CV công khai
          </AppText>
          {profileName ? (
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {profileName}
              {viewMode === 'pdf' ? ' · File PDF' : resumeId ? ' · Hồ sơ đã chọn' : ' · Hồ sơ chính'}
            </AppText>
          ) : (
            <AppText variant="caption" color="textSecondary">
              {viewMode === 'pdf' ? 'Xem file đính kèm' : resumeId ? 'Xem hồ sơ đã chọn' : 'Hiển thị hồ sơ chính'}
            </AppText>
          )}
        </View>
        <Pressable
          onPress={openInBrowser}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Mở trình duyệt"
        >
          <Feather name="external-link" color={colors.primaryDark} size={20} />
        </Pressable>
      </View>

      {canShowPdf && canShowWeb ? (
        <View style={styles.modeTabs}>
          <Pressable
            style={[styles.modeTab, viewMode === 'web' && styles.modeTabActive]}
            onPress={() => {
              setWebError(false);
              setWebReady(false);
              setViewMode('web');
            }}
          >
            <AppText
              variant="caption"
              style={viewMode === 'web' ? styles.modeTabTextActive : styles.modeTabText}
            >
              Bản trình bày
            </AppText>
          </Pressable>
          <Pressable
            style={[styles.modeTab, viewMode === 'pdf' && styles.modeTabActive]}
            onPress={() => {
              setWebError(false);
              setWebReady(false);
              setViewMode('pdf');
            }}
          >
            <AppText
              variant="caption"
              style={viewMode === 'pdf' ? styles.modeTabTextActive : styles.modeTabText}
            >
              File gốc
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : webError ? (
        <View style={styles.center}>
          <AppText
            variant="body"
            color="textMuted"
            style={{ textAlign: 'center', marginBottom: spacing.md }}
          >
            Không thể tải CV trong ứng dụng.
          </AppText>
          <Pressable style={styles.browserBtn} onPress={openInBrowser}>
            <AppText variant="bodySm" style={{ color: colors.white, fontWeight: '700' }}>
              Mở trình duyệt
            </AppText>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={webSourceUri}
          ref={webViewRef}
          source={{ uri: webSourceUri }}
          injectedJavaScriptBeforeContentLoaded={
            viewMode === 'web' ? MOBILE_VIEWPORT_INJECT(token) : undefined
          }
          injectedJavaScript={viewMode === 'web' ? MOBILE_CV_LAYOUT_INJECT : undefined}
          onMessage={handleWebViewMessage}
          onLoadEnd={() => {
            setWebReady(true);
            if (viewMode === 'web') {
              scheduleMobileLayoutRetries();
            }
          }}
          startInLoadingState
          nestedScrollEnabled
          showsVerticalScrollIndicator
          sharedCookiesEnabled={viewMode === 'web'}
          onError={() => setWebError(true)}
          onHttpError={() => setWebError(true)}
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primaryDark} />
            </View>
          )}
          style={styles.webview}
        />
      )}

      {!loading && !webError ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            style={[
              styles.downloadBtn,
              (!primaryActionReady || exporting) && styles.downloadBtnDisabled,
            ]}
            onPress={handlePrimaryAction}
            disabled={!primaryActionReady || exporting}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={primaryActionLabel}
          >
            {exporting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Feather name="download" color={colors.white} size={20} />
            )}
            <AppText variant="body" style={styles.downloadBtnText}>
              {exporting ? 'Đang xử lý…' : primaryActionLabel}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerText: { flex: 1, minWidth: 0 },
  iconBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  modeTabActive: {
    backgroundColor: colors.primaryDark,
  },
  modeTabText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  webview: { flex: 1, backgroundColor: '#e5e7eb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  browserBtn: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  footer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    minHeight: 48,
  },
  downloadBtnDisabled: { opacity: 0.55 },
  downloadBtnText: { color: colors.white, fontWeight: '700' },
});

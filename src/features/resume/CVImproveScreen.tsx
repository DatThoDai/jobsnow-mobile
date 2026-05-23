import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing, fontFamilies } from '../../theme';
import { aiService, ImproveCVResponse } from '../../services/api/aiService';
import { getApiErrorMessage, getSubscriptionHint } from '../../utils/apiError';
import { ApiError } from '../../services/api/client';
import { useAuthStore } from '../../stores/useAuthStore';
import { resumeService } from '../../services/api/resumeService';

type Lang = 'auto' | 'vi' | 'en';

export function CVImproveScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [cvText, setCvText] = useState('');
  const [resumeId, setResumeId] = useState<number | undefined>();
  const [language, setLanguage] = useState<Lang>('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImproveCVResponse | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);

  React.useEffect(() => {
    if (!user?.profileId) return;
    resumeService.getResumesByProfile(user.profileId).then(setResumes).catch(() => {});
  }, [user?.profileId]);

  const runImprove = async (fromFile?: { uri: string; name: string; mimeType?: string }) => {
    setLoading(true);
    setResult(null);
    try {
      const data = fromFile
        ? await aiService.improveCVFromFile(fromFile, language)
        : await aiService.improveCVFromText({
            cvText: cvText.trim() || undefined,
            resumeId,
            language,
          });
      setResult(data);
    } catch (e: unknown) {
      const hint = getSubscriptionHint((e as ApiError)?.statusCode ?? 0);
      Alert.alert('Lỗi', getApiErrorMessage(e, 'Không thể phân tích CV') + (hint ? `\n\n${hint}` : ''));
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    await runImprove({
      uri: asset.uri,
      name: asset.name ?? 'cv.pdf',
      mimeType: asset.mimeType ?? 'application/pdf',
    });
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.accent;
    return colors.danger;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.white} size={22} />
        </Pressable>
        <AppText variant="h2" color="white">Chuẩn hóa CV bằng AI</AppText>
        <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs }}>
          Phân tích và gợi ý cải thiện hồ sơ của bạn
        </AppText>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!result ? (
          <>
            <View style={styles.langRow}>
              {(['auto', 'vi', 'en'] as Lang[]).map((l) => (
                <Pressable
                  key={l}
                  onPress={() => setLanguage(l)}
                  style={[styles.langChip, language === l && styles.langChipActive]}
                >
                  <AppText variant="caption" style={language === l ? styles.langActive : undefined}>
                    {l === 'auto' ? 'Tự động' : l.toUpperCase()}
                  </AppText>
                </Pressable>
              ))}
            </View>

            {resumes.length > 0 && (
              <View style={styles.section}>
                <AppText variant="caption" color="textMuted">CHỌN HỒ SƠ CÓ SẴN</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
                  <Pressable
                    onPress={() => setResumeId(undefined)}
                    style={[styles.resumeChip, !resumeId && styles.resumeChipActive]}
                  >
                    <AppText variant="caption">Văn bản</AppText>
                  </Pressable>
                  {resumes.map((r) => (
                    <Pressable
                      key={r.resumeId}
                      onPress={() => setResumeId(r.resumeId)}
                      style={[styles.resumeChip, resumeId === r.resumeId && styles.resumeChipActive]}
                    >
                      <AppText variant="caption" numberOfLines={1}>
                        {r.resumeName || r.title || `CV #${r.resumeId}`}
                      </AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {!resumeId && (
              <TextInput
                style={styles.textArea}
                placeholder="Dán nội dung CV hoặc chọn file PDF bên dưới..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={cvText}
                onChangeText={setCvText}
              />
            )}

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : (
              <View style={styles.actions}>
                <PrimaryButton
                  title="Phân tích"
                  onPress={() => runImprove()}
                  disabled={!resumeId && !cvText.trim()}
                />
                <Pressable style={styles.fileBtn} onPress={pickFile}>
                  <Feather name="upload" size={18} color={colors.primary} />
                  <AppText variant="bodySm" color="primary">Tải file PDF</AppText>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.scoreCard}>
              <AppText variant="h1" style={{ color: scoreColor(result.overallScore), fontSize: 48 }}>
                {result.overallScore}
              </AppText>
              <AppText variant="caption" color="textMuted">/100 điểm tổng</AppText>
            </View>
            <AppText variant="body" style={{ marginBottom: spacing.lg }}>{result.overviewFeedback}</AppText>
            {result.sections?.map((sec, i) => (
              <View key={i} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>{sec.section}</AppText>
                  <AppText variant="caption" style={{ color: scoreColor(sec.score) }}>{sec.score}%</AppText>
                </View>
                {sec.suggestions?.slice(0, 3).map((s, j) => (
                  <AppText key={j} variant="bodySm" color="textSecondary" style={{ marginTop: 4 }}>
                    • {s}
                  </AppText>
                ))}
              </View>
            ))}
            {result.actionItems?.length > 0 && (
              <View style={styles.section}>
                <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Việc cần làm</AppText>
                {result.actionItems.map((item, i) => (
                  <AppText key={i} variant="bodySm" style={{ marginBottom: 4 }}>✓ {item}</AppText>
                ))}
              </View>
            )}
            <PrimaryButton title="Phân tích lại" onPress={() => setResult(null)} />
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  backBtn: { marginBottom: spacing.md, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  langRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  langChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  langChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langActive: { color: colors.white },
  section: { marginBottom: spacing.lg },
  resumeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    maxWidth: 140,
  },
  resumeChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  actions: { gap: spacing.md },
  fileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md },
  scoreCard: { alignItems: 'center', marginBottom: spacing.lg },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
});

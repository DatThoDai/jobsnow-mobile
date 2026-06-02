import React, { useState, useRef, useCallback } from 'react';
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
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScoreRing, getScoreColor, getScoreLabel } from '../../components/ai/ScoreRing';
import {colors, radius, spacing, shadows, fontFamilies, zIndex } from '../../theme';

import { aiService, ImproveCVResponse, SectionFeedback } from '../../services/api/aiService';
import {
  subscriptionService,
  CandidateSubscriptionStatus,
} from '../../services/api/subscriptionService';
import { getApiErrorMessage, getSubscriptionHint } from '../../utils/apiError';
import { ApiError } from '../../services/api/client';
import { useAuthStore } from '../../stores/useAuthStore';
import { resumeService } from '../../services/api/resumeService';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Lang = 'auto' | 'vi' | 'en';
type InputMode = 'resume' | 'text' | 'file';
type RouteProps = RouteProp<RootStackParamList, 'CVImprove'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function SectionCard({ section }: { section: SectionFeedback }) {
  const [expanded, setExpanded] = useState(false);
  const sc = getScoreColor(section.score);
  const issues = section.issues ?? [];
  const suggestions = section.suggestions ?? [];

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={sectionStyles.card}>
      <Pressable onPress={toggle} style={sectionStyles.header}>
        <View style={[sectionStyles.scoreBox, { borderColor: sc + '50', backgroundColor: sc + '12' }]}>
          <AppText variant="bodySm" style={{ fontWeight: '800', color: sc }}>{section.score}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>{section.section}</AppText>
          <AppText variant="caption" style={{ color: sc }}>{getScoreLabel(section.score)}</AppText>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </Pressable>
      {expanded ? (
        <View style={sectionStyles.body}>
          {issues.length > 0 ? (
            <View style={sectionStyles.issueBox}>
              <AppText variant="caption" style={{ fontWeight: '700', color: colors.danger, marginBottom: 6 }}>
                Vấn đề cần sửa
              </AppText>
              {issues.map((issue, i) => (
                <AppText key={i} variant="bodySm" style={{ color: colors.danger, marginBottom: 4, lineHeight: 20 }}>
                  • {issue}
                </AppText>
              ))}
            </View>
          ) : null}
          {suggestions.length > 0 ? (
            <View style={sectionStyles.suggestBox}>
              <AppText variant="caption" style={{ fontWeight: '700', color: colors.success, marginBottom: 6 }}>
                Gợi ý cải thiện
              </AppText>
              {suggestions.map((s, i) => (
                <AppText key={i} variant="bodySm" color="textSecondary" style={{ marginBottom: 4, lineHeight: 20 }}>
                  • {s}
                </AppText>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ImproveResultView({
  result,
  onReset,
}: {
  result: ImproveCVResponse;
  onReset: () => void;
}) {
  const overallColor = getScoreColor(result.overallScore);
  const keywords = result.missingKeywords ?? [];
  const skills = result.extractedSkills ?? [];
  const sections = result.sections ?? [];
  const actions = result.actionItems ?? [];

  return (
    <View style={styles.resultWrap}>
      <View style={styles.resultHero}>
        <ScoreRing score={result.overallScore} size={130} />
        <View style={[styles.resultBadge, { backgroundColor: overallColor + '15', borderColor: overallColor + '40' }]}>
          <Feather name="cpu" size={14} color={overallColor} />
          <AppText variant="caption" style={{ color: overallColor, fontWeight: '700' }}>
            {getScoreLabel(result.overallScore)}
          </AppText>
        </View>
        <AppText variant="h3" style={{ marginTop: spacing.md, textAlign: 'center' }}>
          Đánh giá chung từ AI
        </AppText>
        <AppText variant="bodySm" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 }}>
          {result.overviewFeedback}
        </AppText>
      </View>

      {result.improvedSummary ? (
        <View style={styles.resultCard}>
          <View style={styles.cardTitleRow}>
            <Feather name="edit-3" size={16} color={colors.primary} />
            <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>Tóm tắt hồ sơ (AI gợi ý)</AppText>
          </View>
          <AppText variant="bodySm" color="textSecondary" style={{ lineHeight: 22, fontStyle: 'italic' }}>
            "{result.improvedSummary}"
          </AppText>
        </View>
      ) : null}

      {skills.length > 0 ? (
        <View style={styles.resultCard}>
          <View style={styles.cardTitleRow}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>
              Kỹ năng đã trích xuất ({skills.length})
            </AppText>
          </View>
          <View style={styles.tagRow}>
            {skills.map((sk, i) => (
              <View key={i} style={[styles.tag, styles.tagSkill]}>
                <AppText variant="caption" style={{ color: colors.success }}>{sk}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {keywords.length > 0 ? (
        <View style={styles.resultCard}>
          <View style={styles.cardTitleRow}>
            <Feather name="alert-triangle" size={16} color={colors.accent} />
            <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>
              Từ khóa nên bổ sung ({keywords.length})
            </AppText>
          </View>
          <View style={styles.tagRow}>
            {keywords.map((kw, i) => (
              <View key={i} style={[styles.tag, styles.tagKw]}>
                <AppText variant="caption" style={{ color: colors.accent }}>{kw}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {sections.length > 0 ? (
        <View style={styles.sectionsBlock}>
          <AppText variant="h3" style={{ marginBottom: spacing.sm }}>Chi tiết từng mục</AppText>
          {sections.map((sec, i) => (
            <SectionCard key={i} section={sec} />
          ))}
        </View>
      ) : null}

      {actions.length > 0 ? (
        <View style={styles.resultCard}>
          <View style={styles.cardTitleRow}>
            <Feather name="list" size={16} color={colors.primary} />
            <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>Việc cần làm ngay</AppText>
          </View>
          {actions.map((item, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={styles.actionCheck}>
                <Feather name="check" size={12} color={colors.white} />
              </View>
              <AppText variant="bodySm" style={{ flex: 1, lineHeight: 20 }}>{item}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      <PrimaryButton title="Phân tích CV khác" onPress={onReset} style={{ marginTop: spacing.md }} />
    </View>
  );
}

export function CVImproveScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const initialResumeId = route.params?.resumeId;
  const autoRun = route.params?.autoRun;

  const [inputMode, setInputMode] = useState<InputMode>(initialResumeId ? 'resume' : 'resume');
  const [cvText, setCvText] = useState('');
  const [resumeId, setResumeId] = useState<number | undefined>(initialResumeId);
  const [language, setLanguage] = useState<Lang>('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImproveCVResponse | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<CandidateSubscriptionStatus | null>(null);
  const [quotaLoaded, setQuotaLoaded] = useState(false);
  const autoRan = useRef(false);

  const remainingTrials = subscription?.remainingAiCvBuilderTrials ?? 0;

  React.useEffect(() => {
    if (!user?.profileId) return;
    setQuotaLoaded(false);
    Promise.all([
      resumeService.getResumesByProfile(user.profileId),
      subscriptionService.getCandidateSubscriptionStatus().catch(() => null),
    ]).then(([list, sub]) => {
      setResumes(list || []);
      setSubscription(sub);
    }).finally(() => setQuotaLoaded(true));
  }, [user?.profileId]);

  const runImprove = useCallback(
    async (fromFile?: { uri: string; name: string; mimeType?: string }) => {
      if (remainingTrials <= 0 && subscription) {
        Alert.alert(
          'Hết lượt chuẩn hóa CV',
          'Bạn đã dùng hết lượt AI CV Builder. Vui lòng mua gói để tiếp tục.',
          [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Xem gói', onPress: () => navigation.navigate('Pricing') },
          ]
        );
        return;
      }

      setLoading(true);
      setResult(null);
      try {
        const data = fromFile
          ? await aiService.improveCVFromFile(fromFile, language)
          : await aiService.improveCVFromText({
              cvText: inputMode === 'text' ? cvText.trim() || undefined : undefined,
              resumeId: inputMode === 'resume' ? resumeId : undefined,
              language,
            });
        setResult(data);
        setSubscription((prev) =>
          prev ? { ...prev, remainingAiCvBuilderTrials: Math.max(0, remainingTrials - 1) } : prev
        );
      } catch (e: unknown) {
        const hint = getSubscriptionHint((e as ApiError)?.statusCode ?? 0);
        Alert.alert('Phân tích thất bại', getApiErrorMessage(e, 'Không thể phân tích CV') + (hint ? `\n\n${hint}` : ''));
      } finally {
        setLoading(false);
      }
    },
    [cvText, resumeId, language, inputMode, remainingTrials, subscription, navigation]
  );

  React.useEffect(() => {
    if (autoRun && initialResumeId && !autoRan.current && quotaLoaded) {
      autoRan.current = true;
      runImprove();
    }
  }, [autoRun, initialResumeId, runImprove, quotaLoaded]);

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setInputMode('file');
    await runImprove({
      uri: asset.uri,
      name: asset.name ?? 'cv.pdf',
      mimeType: asset.mimeType ?? 'application/pdf',
    });
  };

  const canAnalyze =
    inputMode === 'resume'
      ? Boolean(resumeId)
      : inputMode === 'text'
        ? cvText.trim().length > 0
        : false;

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={colors.white} />
        <AppText variant="h3" color="white" style={{ marginTop: spacing.lg }}>
          AI đang phân tích CV...
        </AppText>
        <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm }}>
          Quá trình có thể mất 15–45 giây
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.white} size={22} />
        </Pressable>
        <AppText variant="h2" color="white">Chuẩn hóa CV bằng AI</AppText>
        <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs }}>
          Phân tích ATS, gợi ý cải thiện theo góc nhìn nhà tuyển dụng
        </AppText>
        {subscription ? (
          <View style={styles.headerQuota}>
            <Feather name="zap" size={14} color={colors.accent} />
            <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Còn {remainingTrials} lượt chuẩn hóa CV
            </AppText>
          </View>
        ) : null}
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
          showsVerticalScrollIndicator={false}
        >
          {result ? (
            <ImproveResultView result={result} onReset={() => setResult(null)} />
          ) : (
            <>
              {remainingTrials <= 0 && subscription ? (
                <View style={styles.quotaWarn}>
                  <Feather name="alert-circle" size={22} color={colors.accent} />
                  <AppText variant="bodySm" color="textSecondary" style={{ flex: 1, lineHeight: 20 }}>
                    Bạn đã hết lượt chuẩn hóa CV miễn phí (3 lượt/tài khoản). Mua gói để tiếp tục.
                  </AppText>
                  <PrimaryButton title="Xem gói dịch vụ" onPress={() => navigation.navigate('Pricing')} />
                </View>
              ) : null}

              <View style={styles.modeTabs}>
                {(
                  [
                    { key: 'resume' as const, label: 'CV có sẵn', icon: 'file-text' },
                    { key: 'text' as const, label: 'Dán nội dung', icon: 'align-left' },
                  ] as const
                ).map((tab) => (
                  <Pressable
                    key={tab.key}
                    style={[styles.modeTab, inputMode === tab.key && styles.modeTabActive]}
                    onPress={() => setInputMode(tab.key)}
                  >
                    <Feather
                      name={tab.icon}
                      size={16}
                      color={inputMode === tab.key ? colors.white : colors.textMuted}
                    />
                    <AppText
                      variant="caption"
                      style={inputMode === tab.key ? { color: colors.white, fontWeight: '700' } : undefined}
                    >
                      {tab.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.langRow}>
                {(['auto', 'vi', 'en'] as Lang[]).map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setLanguage(l)}
                    style={[styles.langChip, language === l && styles.langChipActive]}
                  >
                    <AppText variant="caption" style={language === l ? styles.langActive : undefined}>
                      {l === 'auto' ? 'Tự động' : l === 'vi' ? 'Tiếng Việt' : 'English'}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              {inputMode === 'resume' && resumes.length > 0 ? (
                <View style={styles.block}>
                  <AppText variant="caption" color="textMuted" style={styles.blockLabel}>
                    CHỌN HỒ SƠ
                  </AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {resumes.map((r) => (
                      <Pressable
                        key={r.resumeId}
                        onPress={() => setResumeId(r.resumeId)}
                        style={[styles.resumeCard, resumeId === r.resumeId && styles.resumeCardActive]}
                      >
                        <Feather
                          name="file-text"
                          size={20}
                          color={resumeId === r.resumeId ? colors.primary : colors.textMuted}
                        />
                        <AppText variant="caption" numberOfLines={2} style={{ marginTop: 4, textAlign: 'center' }}>
                          {r.resumeName || `CV #${r.resumeId}`}
                        </AppText>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : inputMode === 'resume' ? (
                <View style={styles.emptyResume}>
                  <AppText variant="bodySm" color="textSecondary">Chưa có hồ sơ. Tạo hoặc tải CV trước.</AppText>
                </View>
              ) : null}

              {inputMode === 'text' ? (
                <TextInput
                  style={styles.textArea}
                  placeholder="Dán toàn bộ nội dung CV vào đây..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={cvText}
                  onChangeText={setCvText}
                />
              ) : null}

              <View style={styles.analyzeCard}>
                <PrimaryButton
                  title="Bắt đầu phân tích AI"
                  onPress={() => runImprove()}
                  disabled={!canAnalyze || (remainingTrials <= 0 && !!subscription)}
                />
                <Pressable style={styles.fileBtn} onPress={pickFile}>
                  <View style={styles.fileIconWrap}>
                    <Feather name="upload" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySm" style={{ fontWeight: '700' }}>Tải file PDF</AppText>
                    <AppText variant="caption" color="textMuted">Phân tích trực tiếp từ tệp trên máy</AppText>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  scoreBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  issueBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  suggestBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.md,
    padding: spacing.md,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: { paddingTop: 50, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  backBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    marginBottom: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerQuota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  body: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  quotaWarn: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  modeTabActive: { backgroundColor: colors.primary },
  langRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  langChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langActive: { color: colors.white },
  block: { marginBottom: spacing.lg },
  blockLabel: { marginBottom: spacing.sm, letterSpacing: 0.5 },
  resumeCard: {
    width: 100,
    padding: spacing.md,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  resumeCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  emptyResume: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  textArea: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  analyzeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultWrap: { gap: spacing.md },
  resultHero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  tagSkill: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0' },
  tagKw: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  sectionsBlock: { marginTop: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  actionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});

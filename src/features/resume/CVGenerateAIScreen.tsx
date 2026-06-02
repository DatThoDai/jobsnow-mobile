import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { FormField } from '../../components/FormField';
import { ScreenOverlayHeader } from '../../components/ScreenOverlayHeader';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { aiService, GenerateCVResponse } from '../../services/api/aiService';
import { useAuthStore } from '../../stores/useAuthStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { persistGeneratedCvToResume } from '../../utils/persistGeneratedCv';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Step = 'input' | 'loading' | 'preview';

export function CVGenerateAIScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('input');
  const [targetJob, setTargetJob] = useState('');
  const [industry, setIndustry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [cvData, setCvData] = useState<GenerateCVResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!targetJob.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập vị trí mong muốn.');
      return;
    }
    if (!user?.profileId) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để tạo CV bằng AI.');
      return;
    }
    setStep('loading');
    try {
      const data = await aiService.generateCV({
        profileId: user.profileId,
        targetJob: targetJob.trim(),
        industry: industry.trim() || undefined,
        additionalInfo: additionalInfo.trim() || undefined,
        language,
      });
      setCvData(data);
      setStep('preview');
    } catch (e: unknown) {
      Alert.alert('Tạo CV thất bại', getApiErrorMessage(e, 'Vui lòng thử lại.'));
      setStep('input');
    }
  };

  const handleSave = async () => {
    if (!cvData || !user?.profileId) return;
    setIsSaving(true);
    try {
      const resumeId = await persistGeneratedCvToResume(
        user.profileId,
        `CV ${targetJob.trim()}`,
        cvData,
        cvData.suggestedTemplateKey
      );
      Alert.alert('Đã lưu CV', 'Bạn có thể chỉnh sửa thêm các mục trong hồ sơ.', [
        {
          text: 'Chỉnh sửa',
          onPress: () => navigation.replace('ResumeEdit', { resumeId }),
        },
        {
          text: 'Xem hồ sơ',
          onPress: () => navigation.replace('ResumeDetail', { resumeId }),
        },
      ]);
    } catch (e: unknown) {
      Alert.alert('Lưu thất bại', getApiErrorMessage(e, 'Không thể lưu CV.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'loading') {
    return (
      <View style={styles.centered}>
        <ScreenOverlayHeader onBack={() => setStep('input')} variant="light" backIconColor={colors.textPrimary} />
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.lg }}>
          AI đang tạo CV cho bạn...
        </AppText>
      </View>
    );
  }

  if (step === 'preview' && cvData) {
    return (
      <View style={styles.container}>
        <ScreenOverlayHeader onBack={() => setStep('input')} variant="light" backIconColor={colors.textPrimary} />
        <ScrollView contentContainerStyle={styles.previewScroll} showsVerticalScrollIndicator={false}>
          <AppText variant="h3" style={{ marginBottom: spacing.md }}>
            Kết quả AI
          </AppText>
          {cvData.suggestedTemplateKey ? (
            <View style={styles.templateBadge}>
              <Feather name="layout" size={16} color={colors.primary} />
              <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>
                Mẫu gợi ý: {cvData.suggestedTemplateKey}
              </AppText>
            </View>
          ) : null}

          <PreviewBlock title="Tóm tắt" body={cvData.summary} />
          {(cvData.experiences ?? []).map((exp, i) => (
            <PreviewBlock
              key={`exp-${i}`}
              title={`${exp.title} · ${exp.company}`}
              subtitle={exp.duration}
              body={(exp.bullets ?? []).map((b) => `• ${b}`).join('\n')}
            />
          ))}
          {(cvData.educations ?? []).map((edu, i) => (
            <PreviewBlock
              key={`edu-${i}`}
              title={edu.school}
              subtitle={[edu.degree, edu.major, edu.duration].filter(Boolean).join(' · ')}
            />
          ))}
          {cvData.skillsSection ? <PreviewBlock title="Kỹ năng" body={cvData.skillsSection} /> : null}
          {(cvData.projects ?? []).map((p, i) => (
            <PreviewBlock key={`proj-${i}`} title={p.name} subtitle={p.duration} body={p.description} />
          ))}
          {(cvData.certifications ?? []).length > 0 ? (
            <PreviewBlock title="Chứng chỉ" body={cvData.certifications.join('\n')} />
          ) : null}

          <View style={styles.previewActions}>
            <PrimaryButton title="Tạo lại" variant="outline" onPress={() => setStep('input')} style={{ flex: 1 }} />
            <PrimaryButton
              title={isSaving ? 'Đang lưu...' : 'Lưu vào hồ sơ'}
              onPress={handleSave}
              disabled={isSaving}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenOverlayHeader onBack={() => navigation.goBack()} variant="light" backIconColor={colors.textPrimary} />
      <ScrollView
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formHeader}>
          <View style={styles.aiIcon}>
            <Feather name="zap" size={28} color={colors.primary} />
          </View>
          <AppText variant="h3">Viết CV bằng AI</AppText>
          <AppText variant="bodySm" color="textSecondary" style={{ marginTop: spacing.xs, lineHeight: 20 }}>
            Nhập vị trí mong muốn để AI soạn nội dung CV và lưu vào danh sách hồ sơ của bạn.
          </AppText>
        </View>

        <View style={styles.card}>
          <FormField label="Vị trí mong muốn *" value={targetJob} onChange={setTargetJob} placeholder="VD: Frontend Developer" />
          <FormField label="Ngành nghề" value={industry} onChange={setIndustry} placeholder="VD: Công nghệ thông tin" />

          <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
            Ngôn ngữ CV
          </AppText>
          <View style={styles.langRow}>
            {(['vi', 'en'] as const).map((lang) => (
              <Pressable
                key={lang}
                style={[styles.langChip, language === lang && styles.langChipActive]}
                onPress={() => setLanguage(lang)}
              >
                <AppText
                  variant="bodySm"
                  style={{ fontWeight: '600', color: language === lang ? colors.primary : colors.textSecondary }}
                >
                  {lang === 'vi' ? 'Tiếng Việt' : 'English'}
                </AppText>
              </Pressable>
            ))}
          </View>

          <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
            Thông tin bổ sung (tùy chọn)
          </AppText>
          <TextInput
            style={styles.textArea}
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            placeholder="Mục tiêu nghề nghiệp, kinh nghiệm nổi bật..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <PrimaryButton title="Tạo CV với AI" onPress={handleGenerate} style={{ marginTop: spacing.lg }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PreviewBlock({ title, subtitle, body }: { title: string; subtitle?: string; body?: string }) {
  return (
    <View style={previewStyles.block}>
      <AppText variant="bodySm" style={{ fontWeight: '700' }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      ) : null}
      {body ? (
        <AppText variant="bodySm" color="textSecondary" style={{ marginTop: spacing.sm, lineHeight: 22 }}>
          {body}
        </AppText>
      ) : null}
    </View>
  );
}

const previewStyles = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  formScroll: { paddingTop: 100, paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  previewScroll: { paddingTop: 100, paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'] },
  formHeader: { marginBottom: spacing.lg },
  aiIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  fieldLabel: { marginBottom: spacing.sm, marginTop: spacing.md },
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  langChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 100,
    fontSize: 15,
    fontFamily: fontFamilies.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  templateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  previewActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
});

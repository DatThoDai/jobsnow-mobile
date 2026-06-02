import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { FormField } from '../../components/FormField';
import { ResumeSectionTabs, ResumeSectionTabKey } from '../../components/resume/ResumeSectionTabs';
import { colors, radius, shadows, spacing, zIndex } from '../../theme';
import { useAuthStore } from '../../stores/useAuthStore';
import { resumeService } from '../../services/api/resumeService';
import { saveManualCvDraft } from '../../utils/saveManualCv';
import { getApiErrorMessage } from '../../utils/apiError';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  DraftCertificate,
  DraftEducation,
  DraftProject,
  DraftWorkExp,
  newLocalId,
} from '../../types/manualCvDraft';
import {
  EDUCATION_LEVEL_LABELS_VI,
  WORK_EXPERIENCE_LEVELS,
  getEducationLevelLabel,
  getWorkExperienceLevelLabel,
} from '../../constants/resumeEnums';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = ResumeSectionTabKey;

const TAB_META: Record<Tab, { emptyLabel: string; icon: string }> = {
  education: { emptyLabel: 'học vấn', icon: 'book' },
  experience: { emptyLabel: 'kinh nghiệm', icon: 'briefcase' },
  projects: { emptyLabel: 'dự án', icon: 'folder' },
  certificates: { emptyLabel: 'chứng chỉ', icon: 'award' },
};

const EDUCATION_LEVELS = Object.entries(EDUCATION_LEVEL_LABELS_VI)
  .filter(([k]) => k !== 'ANY')
  .map(([value, label]) => ({ value, label }));

function hasDraftContent(
  resumeName: string,
  summary: string,
  educations: DraftEducation[],
  experiences: DraftWorkExp[],
  projects: DraftProject[],
  certificates: DraftCertificate[]
): boolean {
  if (resumeName.trim() || summary.trim()) return true;
  return (
    educations.some((e) => e.title.trim()) ||
    experiences.some((e) => e.title.trim()) ||
    projects.some((p) => p.title.trim()) ||
    certificates.some((c) => c.title.trim())
  );
}

export function ManualCVCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();

  const [resumeName, setResumeName] = useState('');
  const [summary, setSummary] = useState('');
  const [educations, setEducations] = useState<DraftEducation[]>([]);
  const [experiences, setExperiences] = useState<DraftWorkExp[]>([]);
  const [projects, setProjects] = useState<DraftProject[]>([]);
  const [certificates, setCertificates] = useState<DraftCertificate[]>([]);
  const [tab, setTab] = useState<Tab>('experience');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.profileId) return;
    resumeService.getResumesByProfile(user.profileId).then((list) => {
      if (!resumeName) {
        setResumeName(`Hồ sơ ${(list?.length ?? 0) + 1}`);
      }
    }).catch(() => {
      if (!resumeName) setResumeName('CV của tôi');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.profileId]);

  const activeTabMeta = TAB_META[tab];

  const items =
    tab === 'education'
      ? educations
      : tab === 'experience'
        ? experiences
        : tab === 'projects'
          ? projects
          : certificates;

  const openAdd = () => {
    if (tab === 'education') {
      setForm({ title: '', educationLevel: 'BACHELOR', startDate: '', endDate: '', description: '' });
    } else if (tab === 'experience') {
      setForm({ title: '', level: 'FRESHER', startDate: '', endDate: '', description: '' });
    } else if (tab === 'projects') {
      setForm({ title: '', startDate: '', endDate: '', description: '' });
    } else {
      setForm({ title: '', issueDate: '', description: '' });
    }
    setModalVisible(true);
  };

  const handleAddToDraft = () => {
    if (!form.title?.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề.');
      return;
    }
    const id = newLocalId();
    if (tab === 'education') {
      setEducations((prev) => [
        ...prev,
        {
          localId: id,
          title: form.title.trim(),
          educationLevel: form.educationLevel || 'BACHELOR',
          startDate: form.startDate ?? '',
          endDate: form.endDate ?? '',
          description: form.description ?? '',
        },
      ]);
    } else if (tab === 'experience') {
      setExperiences((prev) => [
        ...prev,
        {
          localId: id,
          title: form.title.trim(),
          level: form.level || 'FRESHER',
          startDate: form.startDate ?? '',
          endDate: form.endDate ?? '',
          description: form.description ?? '',
        },
      ]);
    } else if (tab === 'projects') {
      setProjects((prev) => [
        ...prev,
        {
          localId: id,
          title: form.title.trim(),
          startDate: form.startDate ?? '',
          endDate: form.endDate ?? '',
          description: form.description ?? '',
        },
      ]);
    } else {
      setCertificates((prev) => [
        ...prev,
        {
          localId: id,
          title: form.title.trim(),
          issueDate: form.issueDate ?? '',
          description: form.description ?? '',
        },
      ]);
    }
    setModalVisible(false);
  };

  const removeItem = (localId: string) => {
    if (tab === 'education') setEducations((p) => p.filter((x) => x.localId !== localId));
    else if (tab === 'experience') setExperiences((p) => p.filter((x) => x.localId !== localId));
    else if (tab === 'projects') setProjects((p) => p.filter((x) => x.localId !== localId));
    else setCertificates((p) => p.filter((x) => x.localId !== localId));
  };

  const handleBack = useCallback(() => {
    if (
      hasDraftContent(resumeName, summary, educations, experiences, projects, certificates)
    ) {
      Alert.alert('Hủy tạo CV?', 'Thông tin chưa lưu sẽ bị mất.', [
        { text: 'Ở lại', style: 'cancel' },
        { text: 'Hủy', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    navigation.goBack();
  }, [resumeName, summary, educations, experiences, projects, certificates, navigation]);

  const handleSaveCv = async () => {
    if (!user?.profileId) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu CV.');
      return;
    }
    if (!resumeName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên CV.');
      return;
    }
    setIsSaving(true);
    try {
      const resumeId = await saveManualCvDraft(user.profileId, {
        resumeName,
        summary,
        educations,
        experiences,
        projects,
        certificates,
      });
      Alert.alert('Thành công', 'Đã tạo CV mới.', [
        {
          text: 'Xem hồ sơ',
          onPress: () => navigation.replace('ResumeDetail', { resumeId }),
        },
        {
          text: 'Chỉnh sửa thêm',
          onPress: () => navigation.replace('ResumeEdit', { resumeId }),
        },
      ]);
    } catch (e: unknown) {
      Alert.alert('Lưu thất bại', getApiErrorMessage(e, 'Không thể tạo CV'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderDraftItem = (item: DraftEducation | DraftWorkExp | DraftProject | DraftCertificate) => {
    const localId = item.localId;
    const title = item.title || '—';
    let subtitle: string | null = null;
    let dateLine = '';

    if (tab === 'education' && 'educationLevel' in item) {
      subtitle = getEducationLevelLabel(item.educationLevel);
      dateLine = [item.startDate, item.endDate || 'Hiện tại'].filter(Boolean).join(' — ');
    } else if (tab === 'experience' && 'level' in item) {
      subtitle = getWorkExperienceLevelLabel(item.level);
      dateLine = [item.startDate, item.endDate || 'Hiện tại'].filter(Boolean).join(' — ');
    } else if (tab === 'projects') {
      dateLine = [item.startDate, item.endDate || 'Hiện tại'].filter(Boolean).join(' — ');
    } else if (tab === 'certificates' && 'issueDate' in item) {
      dateLine = item.issueDate ? `Cấp: ${item.issueDate}` : '';
    }

    return (
      <View key={localId} style={styles.itemCard}>
        <View style={styles.itemBody}>
          <AppText variant="bodyMedium" style={styles.itemTitle}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="primary" style={{ fontWeight: '600', marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
          {dateLine ? (
            <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
              {dateLine}
            </AppText>
          ) : null}
          {item.description ? (
            <AppText variant="bodySm" color="textSecondary" numberOfLines={2} style={{ marginTop: 6 }}>
              {item.description}
            </AppText>
          ) : null}
        </View>
        <Pressable onPress={() => removeItem(localId)} style={styles.deleteBtn} hitSlop={8}>
          <Feather name="trash-2" color={colors.danger} size={18} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primaryDark, colors.brandPrimary]} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.headerBtn}>
            <Feather name="arrow-left" color={colors.white} size={22} />
          </Pressable>
          <AppText variant="h2" color="white" style={{ flex: 1, textAlign: 'center' }}>
            Tạo CV thủ công
          </AppText>
          <Pressable onPress={openAdd} style={styles.headerBtn}>
            <Feather name="plus" color={colors.white} size={22} />
          </Pressable>
        </View>
        <AppText variant="caption" style={styles.headerHint}>
          Nhập thông tin bên dưới, bấm «Lưu CV» khi xong — chưa lưu lên server trước đó.
        </AppText>
      </LinearGradient>

      <ScrollView
        style={styles.metaScroll}
        contentContainerStyle={styles.metaContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormField
          label="Tên CV *"
          value={resumeName}
          onChange={setResumeName}
          placeholder="VD: CV Frontend Developer"
        />
        <FormField
          label="Giới thiệu (Summary)"
          value={summary}
          onChange={setSummary}
          multiline
          placeholder="Mô tả ngắn về bản thân..."
        />
      </ScrollView>

      <ResumeSectionTabs active={tab} onChange={setTab} />

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name={activeTabMeta.icon as keyof typeof Feather.glyphMap} size={36} color={colors.primaryDark} />
            <AppText variant="bodySm" color="textMuted" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
              Chưa có {activeTabMeta.emptyLabel}. Bấm + để thêm (chỉ lưu khi bấm «Lưu CV»).
            </AppText>
            <PrimaryButton title={`Thêm ${activeTabMeta.emptyLabel}`} onPress={openAdd} leftIcon="plus" style={{ marginTop: spacing.lg }} />
          </View>
        ) : (
          items.map((item) => renderDraftItem(item))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title={isSaving ? 'Đang lưu...' : 'Lưu CV'}
          onPress={handleSaveCv}
          disabled={isSaving}
          leftIcon="check"
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <AppText variant="h3" style={{ marginBottom: spacing.lg }}>
                Thêm {activeTabMeta.emptyLabel}
              </AppText>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <FormField
                  label="Tiêu đề / Tên *"
                  value={form.title}
                  onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                  placeholder="VD: Công ty ABC, Đại học XYZ..."
                />
                {tab === 'education' && (
                  <>
                    <AppText variant="caption" color="textSecondary" style={styles.pickerLabel}>
                      Bằng cấp
                    </AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                      {EDUCATION_LEVELS.map((lvl) => (
                        <Pressable
                          key={lvl.value}
                          onPress={() => setForm((f) => ({ ...f, educationLevel: lvl.value }))}
                          style={[styles.pickerChip, form.educationLevel === lvl.value && styles.pickerChipActive]}
                        >
                          <AppText
                            variant="caption"
                            style={form.educationLevel === lvl.value ? styles.pickerChipTextActive : styles.pickerChipText}
                          >
                            {lvl.label}
                          </AppText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}
                {tab === 'experience' && (
                  <>
                    <AppText variant="caption" color="textSecondary" style={styles.pickerLabel}>
                      Cấp bậc
                    </AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                      {WORK_EXPERIENCE_LEVELS.map((lvl) => (
                        <Pressable
                          key={lvl.value}
                          onPress={() => setForm((f) => ({ ...f, level: lvl.value }))}
                          style={[styles.pickerChip, form.level === lvl.value && styles.pickerChipActive]}
                        >
                          <AppText
                            variant="caption"
                            style={form.level === lvl.value ? styles.pickerChipTextActive : styles.pickerChipText}
                          >
                            {lvl.label}
                          </AppText>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}
                {tab !== 'certificates' && (
                  <>
                    <FormField
                      label="Ngày bắt đầu"
                      value={form.startDate}
                      onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
                      placeholder="YYYY-MM-DD"
                    />
                    <FormField
                      label="Ngày kết thúc"
                      value={form.endDate}
                      onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
                      placeholder="Để trống nếu đang học/làm"
                    />
                  </>
                )}
                {tab === 'certificates' && (
                  <FormField
                    label="Ngày cấp"
                    value={form.issueDate}
                    onChange={(v) => setForm((f) => ({ ...f, issueDate: v }))}
                    placeholder="YYYY-MM-DD"
                  />
                )}
                <FormField
                  label="Mô tả"
                  value={form.description}
                  onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                  placeholder="Mô tả ngắn..."
                />
              </ScrollView>
              <View style={styles.modalActions}>
                <PrimaryButton title="Hủy" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <PrimaryButton title="Thêm vào CV" onPress={handleAddToDraft} style={{ flex: 1 }} leftIcon="plus" />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingBottom: spacing.md, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHint: { color: 'rgba(255,255,255,0.85)', marginTop: spacing.sm, lineHeight: 18 },
  metaScroll: { maxHeight: 200, flexGrow: 0 },
  metaContent: { padding: spacing.lg, paddingBottom: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: 120 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontWeight: '600' },
  deleteBtn: { padding: spacing.sm },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: 28,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  pickerLabel: { marginBottom: spacing.xs, marginTop: spacing.sm },
  pickerRow: { marginBottom: spacing.md },
  pickerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  pickerChipActive: { borderColor: colors.primaryDark, backgroundColor: colors.primarySoft },
  pickerChipText: { color: colors.textSecondary },
  pickerChipTextActive: { color: colors.primaryDark, fontWeight: '700' },
});

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { FormField } from '../../components/FormField';
import { colors, radius, spacing, shadows } from '../../theme';
import { resumeService } from '../../services/api/resumeService';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ResumeSectionTabs, ResumeSectionTabKey } from '../../components/resume/ResumeSectionTabs';
import {
  EDUCATION_LEVEL_LABELS_VI,
  WORK_EXPERIENCE_LEVELS,
  getEducationLevelLabel,
  getWorkExperienceLevelLabel,
  normalizeDateInput,
} from '../../constants/resumeEnums';
import { getApiErrorMessage } from '../../utils/apiError';

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

export function ResumeEditScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ResumeEdit'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const resumeId = route.params.resumeId;
  const [tab, setTab] = useState<Tab>('education');
  const [loading, setLoading] = useState(true);
  const [educations, setEducations] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const activeTabMeta = TAB_META[tab];

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [edu, exp, proj, cert] = await Promise.all([
        resumeService.getEducations(resumeId),
        resumeService.getWorkExperiences(resumeId),
        resumeService.getProjects(resumeId),
        resumeService.getCertificates(resumeId),
      ]);
      setEducations(edu ?? []);
      setExperiences(exp ?? []);
      setProjects(proj ?? []);
      setCertificates(cert ?? []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const openAdd = () => {
    if (tab === 'education') {
      setForm({ title: '', educationLevel: 'BACHELOR', startDate: '', endDate: '', description: '' });
    } else if (tab === 'experience') {
      setForm({ title: '', level: 'JUNIOR', startDate: '', endDate: '', description: '' });
    } else if (tab === 'projects') {
      setForm({ title: '', startDate: '', endDate: '', description: '' });
    } else {
      setForm({ title: '', issueDate: '', description: '' });
    }
    setModalVisible(true);
  };

  const handleAdd = async () => {
    if (!form.title?.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (tab === 'education') {
        const startDate = normalizeDateInput(form.startDate) || today;
        await resumeService.addEducation(resumeId, {
          title: form.title.trim(),
          educationLevel: form.educationLevel || 'BACHELOR',
          startDate,
          endDate: normalizeDateInput(form.endDate),
          description: form.description?.trim() || null,
        });
      } else if (tab === 'experience') {
        const startDate = normalizeDateInput(form.startDate) || today;
        await resumeService.addWorkExperience(resumeId, {
          title: form.title.trim(),
          level: form.level || 'JUNIOR',
          startDate,
          endDate: normalizeDateInput(form.endDate),
          description: form.description?.trim() || null,
        });
      } else if (tab === 'projects') {
        const startDate = normalizeDateInput(form.startDate) || today;
        await resumeService.addProject(resumeId, {
          title: form.title.trim(),
          startDate,
          endDate: normalizeDateInput(form.endDate),
          description: form.description?.trim() || null,
        });
      } else {
        const issueDate = normalizeDateInput(form.issueDate) || today;
        await resumeService.addCertificate(resumeId, {
          title: form.title.trim(),
          issueDate,
          description: form.description?.trim() || null,
        });
      }
      setModalVisible(false);
      await loadAll();
    } catch (e: unknown) {
      Alert.alert('Lỗi', getApiErrorMessage(e, 'Không thể thêm mục'));
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Xóa', 'Bạn có chắc muốn xóa mục này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            if (tab === 'education') await resumeService.deleteEducation(resumeId, id);
            else if (tab === 'experience') await resumeService.deleteWorkExperience(resumeId, id);
            else if (tab === 'projects') await resumeService.deleteProject(resumeId, id);
            else await resumeService.deleteCertificate(resumeId, id);
            await loadAll();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa');
          }
        },
      },
    ]);
  };

  const items =
    tab === 'education'
      ? educations
      : tab === 'experience'
        ? experiences
        : tab === 'projects'
          ? projects
          : certificates;

  const formatDateRange = (item: any) => {
    if (tab === 'certificates') {
      return item.issueDate ? `Cấp: ${item.issueDate}` : '';
    }
    const start = item.startDate || '';
    const end = item.endDate || 'Hiện tại';
    if (!start) return '';
    return `${start} — ${end}`;
  };

  const renderItem = (item: any) => {
    const id = item.id ?? item.educationId ?? item.experienceId ?? item.projectId ?? item.certificateId;
    const title = item.title || item.name || '—';
    const subtitle =
      tab === 'education'
        ? getEducationLevelLabel(item.educationLevel)
        : tab === 'experience'
          ? getWorkExperienceLevelLabel(item.level)
          : null;
    const dateLine = formatDateRange(item);

    return (
      <View key={String(id)} style={styles.itemCard}>
        <View style={styles.itemTimeline}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineLine} />
        </View>
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
            <View style={styles.dateRow}>
              <Feather name="calendar" size={12} color={colors.textMuted} />
              <AppText variant="caption" color="textMuted" style={{ marginLeft: 4 }}>
                {dateLine}
              </AppText>
            </View>
          ) : null}
          {item.description ? (
            <AppText variant="bodySm" color="textSecondary" numberOfLines={2} style={{ marginTop: 6 }}>
              {item.description}
            </AppText>
          ) : null}
        </View>
        <Pressable onPress={() => handleDelete(id)} style={styles.deleteBtn} hitSlop={8}>
          <Feather name="trash-2" color={colors.danger} size={18} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primaryDark, colors.brandPrimary]} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Feather name="arrow-left" color={colors.white} size={22} />
          </Pressable>
          <AppText variant="h2" color="white" style={{ flex: 1, textAlign: 'center' }}>
            Chỉnh sửa hồ sơ
          </AppText>
          <Pressable onPress={openAdd} style={styles.headerBtn}>
            <Feather name="plus" color={colors.white} size={22} />
          </Pressable>
        </View>
      </LinearGradient>

      <ResumeSectionTabs active={tab} onChange={setTab} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Feather name={activeTabMeta.icon as keyof typeof Feather.glyphMap} size={36} color={colors.primaryDark} />
              </View>
              <AppText variant="h3" style={{ marginTop: spacing.lg }}>
                Chưa có {activeTabMeta.emptyLabel}
              </AppText>
              <AppText variant="bodySm" color="textMuted" style={{ textAlign: 'center', marginTop: spacing.sm }}>
                Thêm thông tin để hồ sơ của bạn trông chuyên nghiệp hơn
              </AppText>
              <PrimaryButton
                title={`Thêm ${activeTabMeta.emptyLabel}`}
                onPress={openAdd}
                leftIcon="plus"
                style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}
              />
            </View>
          ) : (
            items.map(renderItem)
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <PrimaryButton
          title="Xem trước hồ sơ"
          onPress={() => navigation.navigate('ResumeDetail', { resumeId })}
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                          style={[
                            styles.pickerChip,
                            form.educationLevel === lvl.value && styles.pickerChipActive,
                          ]}
                        >
                          <AppText
                            variant="caption"
                            style={
                              form.educationLevel === lvl.value
                                ? styles.pickerChipTextActive
                                : styles.pickerChipText
                            }
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
                            style={
                              form.level === lvl.value ? styles.pickerChipTextActive : styles.pickerChipText
                            }
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
                      hint="VD: 2020-09-01"
                    />
                    <FormField
                      label="Ngày kết thúc"
                      value={form.endDate}
                      onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
                      placeholder="Để trống nếu đang học/làm"
                      hint="YYYY-MM-DD hoặc để trống"
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
                  placeholder="Mô tả ngắn gọn thành tích, vai trò..."
                />
              </ScrollView>
              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Hủy"
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1 }}
                />
                <PrimaryButton title="Lưu" onPress={handleAdd} style={{ flex: 1 }} leftIcon="check" />
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
  header: { paddingTop: 50, paddingBottom: spacing.lg, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { padding: spacing.lg, gap: spacing.sm },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  tabChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  tabText: { color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.white, fontWeight: '700' },
  list: { padding: spacing.lg, paddingBottom: 120 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  itemTimeline: { width: 24, alignItems: 'center', paddingTop: spacing.lg },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryDark,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  itemBody: { flex: 1, padding: spacing.lg, paddingLeft: spacing.sm },
  itemTitle: { fontWeight: '700', fontSize: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  deleteBtn: {
    padding: spacing.lg,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
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
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  pickerLabel: { fontWeight: '600', marginBottom: spacing.sm },
  pickerRow: { marginBottom: spacing.md },
  pickerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  pickerChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  pickerChipText: { color: colors.textSecondary, fontWeight: '600' },
  pickerChipTextActive: { color: colors.white, fontWeight: '700' },
});

import React, { useCallback, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing } from '../../theme';
import { resumeService } from '../../services/api/resumeService';
import { useAuthStore } from '../../stores/useAuthStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  getEducationLevelLabel,
  getWorkExperienceLevelLabel,
} from '../../constants/resumeEnums';

type RouteProps = RouteProp<RootStackParamList, 'ResumeDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ResumeDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const resumeId = route.params.resumeId;

  const [resume, setResume] = useState<any>(null);
  const [educations, setEducations] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setResume(null);
    setEducations([]);
    setExperiences([]);
    setProjects([]);
    setCertificates([]);

    try {
      let currentResume = null;
      if (user?.profileId) {
        const resumes = await resumeService.getResumesByProfile(user.profileId).catch(() => []);
        currentResume = resumes.find(
          (r: any) => r.resumeId === resumeId || r.id === resumeId
        );
        setResume(currentResume);
      }

      const [edu, exp, proj, cert] = await Promise.all([
        resumeService.getEducations(resumeId).catch(() => []),
        resumeService.getWorkExperiences(resumeId).catch(() => []),
        resumeService.getProjects(resumeId).catch(() => []),
        resumeService.getCertificates(resumeId).catch(() => []),
      ]);
      setEducations(edu || []);
      setExperiences(exp || []);
      setProjects(proj || []);
      setCertificates(cert || []);
    } catch {
      // state already cleared
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, user?.profileId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
      </View>
    );
  }

  const fileUrl = resume?.fileUrl || resume?.file_url;
  const isPdfOnly =
    !!fileUrl &&
    educations.length === 0 &&
    experiences.length === 0 &&
    projects.length === 0 &&
    certificates.length === 0;
  const resumeTitle = resume?.resumeName || resume?.title || 'Hồ sơ xin việc';

  return (
    <View style={s.container}>
      <LinearGradient colors={[colors.primaryDark, colors.brandPrimary]} style={s.headerGradient}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={s.headerBtn}>
            <Feather name="arrow-left" color={colors.white} size={22} />
          </Pressable>
          <View style={s.headerTitleWrap}>
            <AppText variant="h3" color="white" numberOfLines={1}>
              {resumeTitle}
            </AppText>
          </View>
          <Pressable
            onPress={() => navigation.navigate('ResumeEdit', { resumeId })}
            style={s.headerBtn}
          >
            <Feather name="edit-2" color={colors.white} size={20} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {fileUrl && (
          <View style={s.pdfBanner}>
            <Feather name="file" size={20} color={colors.primaryDark} />
            <View style={s.pdfBannerText}>
              <AppText variant="bodySm" style={{ fontWeight: '600' }}>
                Tệp đính kèm
              </AppText>
              <AppText variant="caption" color="textSecondary">
                PDF/Word đã tải lên
              </AppText>
            </View>
            <Pressable style={s.viewPdfBtn} onPress={() => Linking.openURL(fileUrl)}>
              <AppText variant="caption" style={{ color: colors.white, fontWeight: '600' }}>
                Xem file
              </AppText>
            </Pressable>
          </View>
        )}

        {!isPdfOnly ? (
          <>
            <SectionBlock
              icon="book"
              title="Học vấn"
              items={educations}
              renderItem={(e: any) => (
                <View>
                  <AppText variant="bodySm" style={s.itemTitle}>
                    {e.title}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {getEducationLevelLabel(e.educationLevel)}
                    {e.startDate ? ` · ${e.startDate}${e.endDate ? ` – ${e.endDate}` : ''}` : ''}
                  </AppText>
                  {e.description ? (
                    <AppText variant="caption" color="textMuted" numberOfLines={2} style={{ marginTop: 4 }}>
                      {e.description}
                    </AppText>
                  ) : null}
                </View>
              )}
            />
            <SectionBlock
              icon="briefcase"
              title="Kinh nghiệm"
              items={experiences}
              renderItem={(e: any) => (
                <View>
                  <AppText variant="bodySm" style={s.itemTitle}>
                    {e.title}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {getWorkExperienceLevelLabel(e.level)}
                    {e.startDate ? ` · ${e.startDate}${e.endDate ? ` – ${e.endDate}` : ' – Hiện tại'}` : ''}
                  </AppText>
                </View>
              )}
            />
            <SectionBlock
              icon="folder"
              title="Dự án"
              items={projects}
              renderItem={(e: any) => (
                <AppText variant="bodySm" style={s.itemTitle}>
                  {e.title || e.name}
                </AppText>
              )}
            />
            <SectionBlock
              icon="award"
              title="Chứng chỉ"
              items={certificates}
              renderItem={(e: any) => (
                <AppText variant="bodySm" style={s.itemTitle}>
                  {e.title || e.name}
                  {e.issueDate ? ` · ${e.issueDate}` : ''}
                </AppText>
              )}
            />
          </>
        ) : fileUrl ? (
          <View style={s.emptyPdf}>
            <Feather name="info" size={36} color={colors.textMuted} />
            <AppText variant="bodySm" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
              Hồ sơ này chỉ có tệp đính kèm. Bấm &quot;Xem file&quot; để xem chi tiết.
            </AppText>
          </View>
        ) : (
          <View style={s.emptyPdf}>
            <AppText variant="bodySm" color="textMuted" style={{ textAlign: 'center' }}>
              Chưa có nội dung. Bấm chỉnh sửa để thêm thông tin.
            </AppText>
          </View>
        )}

        {user?.profileId ? (
          <Pressable
            style={s.previewBtn}
            onPress={() =>
              navigation.navigate('PublicCVPreview', {
                profileId: user.profileId!,
                resumeId,
              })
            }
          >
            <Feather name="eye" size={16} color={colors.primaryDark} />
            <AppText variant="bodySm" style={{ color: colors.primaryDark, fontWeight: '600' }}>
              Xem CV công khai
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SectionBlock({
  icon,
  title,
  items,
  renderItem,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  items: any[];
  renderItem: (item: any) => React.ReactNode;
}) {
  if (!items?.length) return null;
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Feather name={icon} color={colors.primaryDark} size={16} />
        <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>
          {title}
        </AppText>
      </View>
      {items.map((item: any, i: number) => (
        <View key={item.id ?? item.educationId ?? item.experienceId ?? item.projectId ?? item.certificateId ?? i} style={s.itemCard}>
          {renderItem(item)}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitleWrap: { flex: 1 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: spacing.md, paddingBottom: spacing['3xl'] },
  section: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTitle: { fontWeight: '600', fontSize: 14, lineHeight: 20 },
  pdfBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pdfBannerText: { flex: 1, marginLeft: spacing.sm },
  viewPdfBtn: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  emptyPdf: { alignItems: 'center', paddingVertical: spacing.xl },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

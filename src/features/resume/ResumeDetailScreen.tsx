import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing } from '../../theme';
import { resumeService } from '../../services/api/resumeService';
import { useAuthStore } from '../../stores/useAuthStore';
import { RootStackParamList } from '../../navigation/RootNavigator';

type RouteProps = RouteProp<RootStackParamList, 'ResumeDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ResumeDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const [resume, setResume] = useState<any>(null);
  const [educations, setEducations] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let currentResume = null;
        if (user?.profileId) {
          const resumes = await resumeService.getResumesByProfile(user.profileId).catch(() => []);
          currentResume = resumes.find((r: any) => r.resumeId === route.params.resumeId || r.id === route.params.resumeId);
          setResume(currentResume);
        }

        const [edu, exp, proj, cert] = await Promise.all([
          resumeService.getEducations(route.params.resumeId).catch(() => []),
          resumeService.getWorkExperiences(route.params.resumeId).catch(() => []),
          resumeService.getProjects(route.params.resumeId).catch(() => []),
          resumeService.getCertificates(route.params.resumeId).catch(() => []),
        ]);
        setEducations(edu || []);
        setExperiences(exp || []);
        setProjects(proj || []);
        setCertificates(cert || []);
      } catch (e) {} finally { setIsLoading(false); }
    };
    load();
  }, [route.params.resumeId, user?.profileId]);

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const fileUrl = resume?.fileUrl || resume?.file_url;
  const isPdfOnly = !!fileUrl && educations.length === 0 && experiences.length === 0;

  return (
    <View style={s.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={s.headerGradient}>
        <View style={s.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={s.headerBtn}>
            <Feather name="arrow-left" color={colors.white} size={22} />
          </Pressable>
          <AppText variant="h2" color="white">Chi tiết hồ sơ</AppText>
          {isPdfOnly ? <View style={{ width: 40 }} /> : (
            <Pressable onPress={() => Alert.alert('Chỉnh sửa', 'Tính năng chỉnh sửa chi tiết hồ sơ sẽ được mở trong màn hình tiếp theo.')} style={s.headerBtn}>
              <Feather name="edit-2" color={colors.white} size={20} />
            </Pressable>
          )}
        </View>
      </LinearGradient>
      
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {fileUrl && (
          <View style={s.pdfBanner}>
            <Feather name="file" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <AppText variant="bodyMedium" style={{ fontWeight: '600' }}>Hồ sơ tải lên (PDF/Doc)</AppText>
              <AppText variant="caption" color="textSecondary">Bạn đã tải lên một tệp tin thay vì tạo trực tiếp.</AppText>
            </View>
            <Pressable style={s.viewPdfBtn} onPress={() => Linking.openURL(fileUrl)}>
              <AppText variant="caption" color="white" style={{ fontWeight: '600' }}>Xem File</AppText>
            </Pressable>
          </View>
        )}

        {!isPdfOnly ? (
          <>
            <SectionBlock icon="book" title="Học vấn" items={educations}
              renderItem={(e: any) => <AppText variant="bodyMedium" color="textPrimary">{e.educationLevel} tại {e.title}</AppText>} />
            <SectionBlock icon="briefcase" title="Kinh nghiệm làm việc" items={experiences}
              renderItem={(e: any) => <AppText variant="bodyMedium" color="textPrimary">{e.level || 'Nhân viên'} tại {e.title}</AppText>} />
            <SectionBlock icon="folder" title="Dự án" items={projects}
              renderItem={(e: any) => <AppText variant="bodyMedium" color="textPrimary">{e.title || e.name}</AppText>} />
            <SectionBlock icon="award" title="Chứng chỉ" items={certificates}
              renderItem={(e: any) => <AppText variant="bodyMedium" color="textPrimary">{e.title || e.name}</AppText>} />
          </>
        ) : (
          <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
            <Feather name="info" size={48} color={colors.textMuted} />
            <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
              Hồ sơ này chỉ có tệp đính kèm. Vui lòng bấm "Xem File" để xem chi tiết.
            </AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SectionBlock({ icon, title, items, renderItem }: { icon: any, title: string, items: any[], renderItem: any }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Feather name={icon} color={colors.primary} size={20} />
        <AppText variant="h3">{title}</AppText>
      </View>
      {items.map((item: any, i: number) => (
        <View key={item.id || i} style={s.itemCard}>{renderItem(item)}</View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerGradient: {
    paddingTop: 50, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  itemCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  pdfBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.lg, borderRadius: radius.xl, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: colors.primary + '30', ...shadows.md,
  },
  viewPdfBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderRadius: radius.pill,
  },
});

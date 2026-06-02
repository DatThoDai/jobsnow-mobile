import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import {colors, radius, shadows, spacing, zIndex } from '../../theme';

import { useAuthStore } from '../../stores/useAuthStore';
import { applicationService } from '../../services/api/applicationService';
import { savedJobService } from '../../services/api/savedJobService';
import { resumeService } from '../../services/api/resumeService';
import { aiService, JobMatchItem } from '../../services/api/aiService';
import {
  subscriptionService,
  CandidateSubscriptionStatus,
} from '../../services/api/subscriptionService';
import { useJobStore } from '../../stores/useJobStore';
import { getApiErrorMessage, getSubscriptionHint } from '../../utils/apiError';
import { ApiError } from '../../services/api/client';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { latestJobs, fetchHomeJobs } = useJobStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [resumesCount, setResumesCount] = useState(0);
  const [matches, setMatches] = useState<JobMatchItem[]>([]);
  const [subscription, setSubscription] = useState<CandidateSubscriptionStatus | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  const profileId = user?.profileId;

  const load = useCallback(async () => {
    if (!profileId || !user) return;
    try {
      const [apps, saved, resumes, matchList, sub] = await Promise.all([
        applicationService.getApplicationsByJobSeeker(profileId).catch(() => []),
        savedJobService.getSavedJobs(profileId).catch(() => []),
        resumeService.getResumesByProfile(profileId).catch(() => []),
        aiService.getMyMatches(profileId).catch(() => []),
        subscriptionService.getCandidateSubscriptionStatus().catch(() => null),
      ]);
      setApplicationsCount(apps?.length ?? 0);
      setSavedCount(saved?.length ?? 0);
      setResumesCount(resumes?.length ?? 0);
      setMatches(matchList ?? []);
      setSubscription(sub);
      await fetchHomeJobs();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileId, user, fetchHomeJobs]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleRecalculate = async () => {
    if (!profileId) return;
    setRecalculating(true);
    try {
      await aiService.recalculateForProfile(profileId);
      const matchList = await aiService.getMyMatches(profileId);
      setMatches(matchList);
      Alert.alert('Thành công', 'Đã cập nhật độ phù hợp việc làm');
    } catch (e: unknown) {
      const hint = getSubscriptionHint((e as ApiError)?.statusCode ?? 0);
      Alert.alert('Lỗi', getApiErrorMessage(e, 'Cập nhật thất bại') + (hint ? `\n\n${hint}` : ''));
    } finally {
      setRecalculating(false);
    }
  };

  const scoreStyle = (score: number) => {
    if (score >= 80) return { bg: '#DCFCE7', text: '#166534' };
    if (score >= 60) return { bg: '#DBEAFE', text: '#1E40AF' };
    if (score >= 40) return { bg: '#FEF9C3', text: '#854D0E' };
    return { bg: '#FEE2E2', text: '#991B1B' };
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.white} size={22} />
        </Pressable>
        <AppText variant="h2" color="white">Bảng điều khiển</AppText>
        <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          Xin chào, {user?.fullName || 'bạn'}!
        </AppText>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        >
          {subscription && (
            <View style={styles.quotaCard}>
              <Feather name="zap" color={colors.accent} size={20} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySm" color="textSecondary">Lượt AI Matching còn lại</AppText>
                <AppText variant="h3">{subscription.remainingAiMatches}</AppText>
              </View>
              <Pressable onPress={() => navigation.navigate('Pricing')}>
                <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>Nâng cấp</AppText>
              </Pressable>
            </View>
          )}

          <View style={styles.statsRow}>
            <StatCard icon="briefcase" label="Ứng tuyển" value={applicationsCount} onPress={() => navigation.getParent()?.navigate('Main', { screen: 'ApplicationsTab' } as never)} />
            <StatCard icon="bookmark" label="Đã lưu" value={savedCount} onPress={() => navigation.getParent()?.navigate('Main', { screen: 'SavedTab' } as never)} />
            <StatCard icon="file-text" label="Hồ sơ" value={resumesCount} onPress={() => navigation.navigate('ResumeList')} />
          </View>

          <View style={styles.sectionHeader}>
            <AppText variant="h3">Việc làm phù hợp AI</AppText>
            <Pressable onPress={handleRecalculate} disabled={recalculating} style={styles.refreshBtn}>
              <Feather name="refresh-cw" size={16} color={colors.primary} />
              <AppText variant="caption" color="primary">{recalculating ? '...' : 'Cập nhật'}</AppText>
            </Pressable>
          </View>

          {matches.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="target" size={40} color={colors.textMuted} />
              <AppText variant="bodySm" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.sm }}>
                Chưa có dữ liệu phù hợp. Nhấn Cập nhật để AI tính điểm.
              </AppText>
              <PrimaryButton title="Tính ngay" onPress={handleRecalculate} style={{ marginTop: spacing.md }} />
            </View>
          ) : (
            matches.slice(0, 8).map((m) => {
              const sc = scoreStyle(m.overallScore);
              return (
                <Pressable
                  key={m.id}
                  style={styles.matchRow}
                  onPress={() => navigation.navigate('JobDetail', { jobId: m.jobId })}
                >
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" style={{ fontWeight: '600' }} numberOfLines={1}>{m.jobTitle}</AppText>
                    <AppText variant="caption" color="textSecondary" numberOfLines={1}>{m.companyName}</AppText>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: sc.bg }]}>
                    <AppText variant="caption" style={{ color: sc.text, fontWeight: '700' }}>{m.overallScore}%</AppText>
                  </View>
                </Pressable>
              );
            })
          )}

          <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
            <AppText variant="h3">Việc làm đề xuất</AppText>
          </View>
          {latestJobs.slice(0, 5).map((job) => (
            <Pressable
              key={job.jobId}
              style={styles.jobRow}
              onPress={() => navigation.navigate('JobDetail', { jobId: job.jobId })}
            >
              <AppText variant="body" numberOfLines={1} style={{ fontWeight: '600', flex: 1 }}>{job.title}</AppText>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <Feather name={icon as any} color={colors.primary} size={20} />
      <AppText variant="h2" style={{ marginTop: 4 }}>{value}</AppText>
      <AppText variant="caption" color="textSecondary">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  backBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  quotaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyBox: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.xl },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

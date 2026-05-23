import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Animated, useWindowDimensions, Pressable, Alert, Image, ImageBackground, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Job } from '../../services/api/models';
import { jobService } from '../../services/api/jobService';
import { savedJobService } from '../../services/api/savedJobService';
import { applicationService } from '../../services/api/applicationService';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  buildJobShareUrl,
  openFacebookShare,
  openLinkedInShare,
  shareNative,
} from '../../utils/share';
import { getEducationLevelLabel, getJobTypeLabelVi } from '../../constants/resumeEnums';

type RouteProps = RouteProp<RootStackParamList, 'JobDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function JobDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const HEADER_MAX_HEIGHT = 320;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const headerZindex = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 10],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await jobService.getJobById(route.params.jobId);
        setJob(data);
        if (user?.profileId) {
          const saved = await savedJobService.isJobSaved(user.profileId, route.params.jobId);
          setIsSaved(saved);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [route.params.jobId, user?.profileId]);

  const handleToggleSave = async () => {
    if (!user?.profileId) return;
    try {
      if (isSaved) {
        await savedJobService.unsaveJob(user.profileId, route.params.jobId);
        setIsSaved(false);
      } else {
        await savedJobService.saveJob(user.profileId, route.params.jobId);
        setIsSaved(true);
      }
    } catch (e) {}
  };

  const handleApply = async () => {
    if (!user?.profileId) {
      Alert.alert('Yêu cầu hồ sơ', 'Vui lòng hoàn tất hồ sơ trước khi ứng tuyển.');
      return;
    }
    setIsApplying(true);
    try {
      await applicationService.applyForJob(route.params.jobId, user.profileId, 0);
      Alert.alert('Ứng tuyển thành công', 'Hồ sơ của bạn đã được gửi đi.');
    } catch (e: any) {
      Alert.alert('Ứng tuyển thất bại', e.message || 'Đã xảy ra lỗi.');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading || !job) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return 'Thương lượng';
    const fmt = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(0)} triệu`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
      return `${n}`;
    };
    const currency = job.salaryCurrency || 'VND';
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)} ${currency}`;
    if (job.salaryMin) return `Từ ${fmt(job.salaryMin)} ${currency}`;
    return `Đến ${fmt(job.salaryMax!)} ${currency}`;
  };

  const htmlTagsStyles = {
    p: { color: colors.textSecondary, marginBottom: 8, fontSize: 15, lineHeight: 24, fontFamily: fontFamilies.body },
    ul: { color: colors.textSecondary, marginBottom: 8 },
    li: { marginBottom: 4, fontSize: 15, lineHeight: 22 },
    strong: { color: colors.textPrimary },
  };

  const InfoChip = ({ icon, text }: { icon: string; text: string }) => (
    <View style={styles.chip}>
      <Feather name={icon as any} color={colors.primary} size={14} />
      <AppText variant="caption" color="textSecondary">{text}</AppText>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerWrap, { height: headerHeight, zIndex: headerZindex }]}>
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: imageOpacity }}>
          {job.thumbnailUrl ? (
            <ImageBackground source={{ uri: job.thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <LinearGradient
            colors={job.thumbnailUrl ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)'] : [colors.primary, colors.primaryDark]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.headerGradient}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <Feather name="arrow-left" color={colors.white} size={22} />
            </Pressable>
            <Pressable onPress={handleToggleSave} style={styles.headerBtn}>
              <Feather
                name="heart"
                color={isSaved ? colors.danger : colors.white}
                size={22}
              />
            </Pressable>
          </View>

          <Animated.View style={[styles.heroContent, { opacity: imageOpacity }]}>
            {job.hotTag && job.hotTag !== 'NORMAL' && (
              <View style={styles.hotBadge}>
                <Feather name="zap" color={colors.accent} size={12} />
                <AppText variant="caption" style={{ color: colors.accent }}>{job.hotTag}</AppText>
              </View>
            )}
            <AppText variant="h2" color="white" style={styles.heroTitle} numberOfLines={2}>{job.title}</AppText>
            <Pressable onPress={() => navigation.navigate('CompanyDetail', { companyId: job.companyId || 0 })} style={styles.companyRow}>
              {job.companyLogo ? (
                <Image source={{ uri: job.companyLogo }} style={styles.companyLogoSmall} />
              ) : (
                <View style={[styles.companyLogoSmall, { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }]}>
                  <Feather name="briefcase" color={colors.white} size={14} />
                </View>
              )}
              <AppText variant="body" style={{ color: 'rgba(255,255,255,0.9)' }}>{job.companyName}</AppText>
              <Feather name="chevron-right" color="rgba(255,255,255,0.5)" size={16} />
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MAX_HEIGHT }]} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.salaryCard}>
          <View style={styles.salaryRow}>
            <Feather name="dollar-sign" color={colors.success} size={20} />
            <AppText variant="h3" style={{ color: colors.success, fontWeight: '700' }}>
              {formatSalary()}
            </AppText>
          </View>
        </View>

        <View style={styles.chipRow}>
          {job.location && <InfoChip icon="map-pin" text={job.location} />}
          {job.jobType && <InfoChip icon="briefcase" text={getJobTypeLabelVi(job.jobType)} />}
          {job.yearsOfExperience && <InfoChip icon="clock" text={job.yearsOfExperience} />}
          {job.educationLevel && (
            <InfoChip icon="award" text={getEducationLevelLabel(job.educationLevel)} />
          )}
        </View>

        {job.description && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="file-text" color={colors.primary} size={18} />
              <AppText variant="h3">Mô tả công việc</AppText>
            </View>
            <RenderHtml
              contentWidth={width - spacing.lg * 2 - spacing.xl * 2}
              source={{ html: job.description }}
              tagsStyles={htmlTagsStyles}
            />
          </View>
        )}

        {job.requirements && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="check-circle" color={colors.primary} size={18} />
              <AppText variant="h3">Yêu cầu</AppText>
            </View>
            <RenderHtml
              contentWidth={width - spacing.lg * 2 - spacing.xl * 2}
              source={{ html: job.requirements }}
              tagsStyles={htmlTagsStyles}
            />
          </View>
        )}

        {job.benefits && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="gift" color={colors.primary} size={18} />
              <AppText variant="h3">Quyền lợi</AppText>
            </View>
            <RenderHtml
              contentWidth={width - spacing.lg * 2 - spacing.xl * 2}
              source={{ html: job.benefits }}
              tagsStyles={htmlTagsStyles}
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Feather name="share-2" color={colors.primary} size={18} />
            <AppText variant="h3">Chia sẻ việc làm</AppText>
          </View>
          <View style={styles.shareRow}>
            <Pressable
              style={styles.shareBtn}
              onPress={() => openFacebookShare(buildJobShareUrl(job.jobId))}
            >
              <Feather name="facebook" color="#1877F2" size={22} />
              <AppText variant="caption" style={styles.shareBtnText}>
                Facebook
              </AppText>
            </Pressable>
            <Pressable
              style={styles.shareBtn}
              onPress={() => openLinkedInShare(buildJobShareUrl(job.jobId))}
            >
              <Feather name="linkedin" color="#0A66C2" size={22} />
              <AppText variant="caption" style={styles.shareBtnText}>
                LinkedIn
              </AppText>
            </Pressable>
            <Pressable
              style={styles.shareBtn}
              onPress={() => shareNative(job.title, buildJobShareUrl(job.jobId))}
            >
              <Feather name="share" color={colors.primaryDark} size={22} />
              <AppText variant="caption" style={styles.shareBtnText}>
                Khác
              </AppText>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleToggleSave}
          style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
        >
          <Feather name="heart" color={isSaved ? colors.danger : colors.textMuted} size={22} />
        </Pressable>
        <PrimaryButton
          title={isApplying ? 'Đang gửi...' : 'Ứng tuyển ngay'}
          onPress={handleApply}
          disabled={isApplying}
          style={styles.applyButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerWrap: { 
    position: 'absolute', top: 0, left: 0, right: 0,
    overflow: 'hidden', backgroundColor: colors.primary 
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: { gap: spacing.xs, flex: 1, justifyContent: 'flex-end', paddingBottom: 20 },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  companyLogoSmall: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.white },
  hotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4,
  },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  salaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: spacing.md,
  },
  salaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg, paddingBottom: 24,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.xl,
  },
  saveBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.danger,
  },
  applyButton: { flex: 1 },
  shareRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  shareBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shareBtnText: { fontWeight: '600', color: colors.textSecondary },
});

import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Pressable,
  Alert,
  Image,
  ImageBackground,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { HotTagBadge } from '../../components/jobs/HotTagBadge';
import { RelatedJobCard } from '../../components/jobs/RelatedJobCard';
import { ScreenOverlayHeader, HeaderOverlayButton } from '../../components/ScreenOverlayHeader';
import { colors, radius, shadows, spacing, fontFamilies, zIndex, HEADER_SAFE_TOP } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Job, Company, Resume } from '../../services/api/models';
import { jobService } from '../../services/api/jobService';
import { savedJobService } from '../../services/api/savedJobService';
import { applicationService } from '../../services/api/applicationService';
import { resumeService } from '../../services/api/resumeService';
import { companyService } from '../../services/api/companyService';
import { aiService, JobMatchResponse } from '../../services/api/aiService';
import { JobMatchResultCard } from '../../components/ai/JobMatchResultCard';
import { useAuthStore } from '../../stores/useAuthStore';
import { subscriptionService, CandidateSubscriptionStatus } from '../../services/api/subscriptionService';
import { getApiErrorMessage, getSubscriptionHint } from '../../utils/apiError';
import { ApiError } from '../../services/api/client';
import {
  buildJobShareUrl,
  openFacebookShare,
  openLinkedInShare,
  shareNative,
} from '../../utils/share';
import { getJobTypeLabelVi } from '../../constants/resumeEnums';
import {
  getApplicationLanguageLabel,
  getGenderRequirementLabel,
  getSocialPlatformLabel,
} from '../../constants/jobEnums';
import {
  formatJobSalary,
  formatExperienceText,
  getDeadlineInfo,
  getSkillsLine,
  getMajorsLine,
  getAgeLine,
  isJobAvailable,
  formatPostedDate,
  getEducationLevelLabel,
} from '../../utils/jobDetailFormat';

type RouteProps = RouteProp<RootStackParamList, 'JobDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={metaStyles.row}>
      <View style={metaStyles.iconWrap}>
        <Feather name={icon as any} size={14} color={colors.primary} />
      </View>
      <View style={metaStyles.textWrap}>
        <AppText variant="caption" color="textMuted">{label}</AppText>
        <AppText variant="bodySm" style={metaStyles.value}>{value}</AppText>
      </View>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  value: { fontWeight: '600', marginTop: 2 },
});

export function JobDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [primaryResumeId, setPrimaryResumeId] = useState<number | undefined>();
  const [selectedResumeId, setSelectedResumeId] = useState<number | undefined>();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [matchResult, setMatchResult] = useState<JobMatchResponse | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [subscription, setSubscription] = useState<CandidateSubscriptionStatus | null>(null);

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
        const jobId = route.params.jobId;
        const data = await jobService.getJobById(jobId);
        setJob(data);

        const [related, compJobs] = await Promise.all([
          jobService.getRelatedJobs(jobId, 8).catch(() => []),
          data.companyId
            ? companyService.getCompanyJobs(data.companyId).catch(() => [])
            : Promise.resolve([]),
        ]);
        setRelatedJobs(related.filter((j) => j.jobId !== jobId));
        setCompanyJobs(
          compJobs.filter(
            (j) =>
              j.jobId !== jobId &&
              j.isDeleted !== true &&
              j.isExpired !== true &&
              j.isActive !== false &&
              j.isApproved !== false
          )
        );

        if (data.companyId) {
          companyService.getCompanyById(data.companyId).then(setCompany).catch(() => null);
        }

        if (user?.profileId) {
          const [saved, resumeList, sub, apps] = await Promise.all([
            savedJobService.isJobSaved(user.profileId, jobId),
            resumeService.getResumesByProfile(user.profileId).catch(() => []),
            subscriptionService.getCandidateSubscriptionStatus().catch(() => null),
            applicationService.getApplicationsByJobSeeker(user.profileId).catch(() => []),
          ]);
          setIsSaved(saved);
          setSubscription(sub);
          setResumes(resumeList);
          const primary = resumeList.find((r) => r.isPrimary) ?? resumeList[0];
          setPrimaryResumeId(primary?.resumeId);
          setSelectedResumeId(primary?.resumeId);
          setHasApplied(apps.some((a) => a.job?.jobId === jobId));
        }
      } catch {
        // keep loading false; job stays null
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
    } catch {
      // ignore
    }
  };

  const remainingMatches = subscription?.remainingAiMatches ?? 0;

  const handleAiMatch = async () => {
    if (!user?.profileId) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập và hoàn thiện hồ sơ để dùng AI phân tích.');
      return;
    }
    if (remainingMatches <= 0) {
      Alert.alert(
        'Hết lượt AI Matching',
        'Bạn chưa có lượt phân tích phù hợp. Vui lòng mua hoặc nâng cấp gói ứng viên.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Xem gói dịch vụ', onPress: () => navigation.navigate('Pricing') },
        ]
      );
      return;
    }
    setIsMatching(true);
    setMatchResult(null);
    try {
      const data = await aiService.calculateJobMatch({
        jobId: route.params.jobId,
        profileId: user.profileId,
        ...(primaryResumeId ? { resumeId: primaryResumeId } : {}),
      });
      setMatchResult(data);
      setSubscription((prev) =>
        prev ? { ...prev, remainingAiMatches: Math.max(0, remainingMatches - 1) } : prev
      );
    } catch (e: unknown) {
      const hint = getSubscriptionHint((e as ApiError)?.statusCode ?? 0);
      Alert.alert(
        'Phân tích thất bại',
        getApiErrorMessage(e, 'Không thể phân tích độ phù hợp') + (hint ? `\n\n${hint}` : '')
      );
    } finally {
      setIsMatching(false);
    }
  };

  const submitApply = async () => {
    const resumeId = selectedResumeId ?? primaryResumeId;
    if (!user?.profileId) {
      Alert.alert('Yêu cầu hồ sơ', 'Vui lòng hoàn tất hồ sơ trước khi ứng tuyển.');
      return;
    }
    if (!resumeId) {
      Alert.alert('Chưa có CV', 'Vui lòng tải CV lên trước khi ứng tuyển.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Quản lý CV', onPress: () => navigation.navigate('ResumeList') },
      ]);
      return;
    }
    setIsApplying(true);
    try {
      await applicationService.applyForJob(route.params.jobId, user.profileId, resumeId);
      setHasApplied(true);
      setShowApplyModal(false);
      setCoverLetter('');
      Alert.alert('Ứng tuyển thành công', 'Hồ sơ của bạn đã được gửi đi.');
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, 'Đã xảy ra lỗi.');
      if (msg.toLowerCase().includes('already applied')) {
        setHasApplied(true);
        Alert.alert('Đã ứng tuyển', 'Bạn đã ứng tuyển công việc này rồi.');
      } else if (msg.toLowerCase().includes('not available')) {
        Alert.alert('Không khả dụng', 'Công việc không còn khả dụng.');
      } else {
        Alert.alert('Ứng tuyển thất bại', msg);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const openApplyFlow = () => {
    if (!user?.profileId) {
      Alert.alert('Yêu cầu hồ sơ', 'Vui lòng đăng nhập và hoàn thiện hồ sơ trước khi ứng tuyển.');
      return;
    }
    if (hasApplied) return;
    if (job && !isJobAvailable(job)) {
      Alert.alert('Không khả dụng', 'Tin tuyển dụng này hiện không còn nhận hồ sơ.');
      return;
    }
    if (resumes.length === 0) {
      Alert.alert('Chưa có CV', 'Vui lòng tải CV lên trước khi ứng tuyển.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Quản lý CV', onPress: () => navigation.navigate('ResumeList') },
      ]);
      return;
    }
    setShowApplyModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.centered}>
        <AppText variant="body" color="textSecondary">Không tìm thấy việc làm</AppText>
        <PrimaryButton title="Quay lại" onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const deadlineInfo = getDeadlineInfo(job);
  const postedLabel = formatPostedDate(job.postedAt);
  const experienceText = formatExperienceText(job.yearsOfExperience);
  const skillsLine = getSkillsLine(job);
  const majorsLine = getMajorsLine(job);
  const ageLine = getAgeLine(job);
  const available = isJobAvailable(job);

  const contactName = job.contactPersonName || company?.nameUserContact;
  const contactAddress = job.companyAddress || company?.address || job.location;
  const contactTutorial = job.contactTutorial || company?.tutorialApply;
  const socials =
    (company?.socials?.length ? company.socials : job.companySocials) ?? [];

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

  const applyLabel = hasApplied
    ? 'Đã ứng tuyển'
    : !available
      ? 'Hết hạn / Đóng'
      : isApplying
        ? 'Đang gửi...'
        : 'Ứng tuyển ngay';

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

        <View style={styles.headerGradient} pointerEvents="box-none">
          <Animated.View style={[styles.heroContent, { opacity: imageOpacity }]}>
            <HotTagBadge tag={job.hotTag} />
            <AppText variant="h2" color="white" style={styles.heroTitle} numberOfLines={2}>{job.title}</AppText>
            <Pressable
              onPress={() => job.companyId && navigation.navigate('CompanyDetail', { companyId: job.companyId })}
              style={styles.companyRow}
            >
              {job.companyLogo ? (
                <Image source={{ uri: job.companyLogo }} style={styles.companyLogoSmall} />
              ) : (
                <View style={[styles.companyLogoSmall, styles.companyLogoPlaceholder]}>
                  <Feather name="briefcase" color={colors.white} size={14} />
                </View>
              )}
              <AppText variant="body" style={{ color: 'rgba(255,255,255,0.9)', flex: 1 }} numberOfLines={1}>
                {job.companyName}
              </AppText>
              {job.companyId ? (
                <Feather name="chevron-right" color="rgba(255,255,255,0.5)" size={16} />
              ) : null}
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MAX_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <View style={styles.salaryCard}>
          <View style={styles.salaryRow}>
            <Feather name="dollar-sign" color={colors.success} size={20} />
            <AppText variant="h3" style={{ color: colors.success, fontWeight: '700' }}>
              {formatJobSalary(job)}
            </AppText>
          </View>
          {(deadlineInfo || postedLabel) && (
            <View style={styles.dateRow}>
              {deadlineInfo ? (
                <AppText variant="caption" color="textSecondary">
                  Hạn nộp: <AppText variant="caption" style={{ fontWeight: '600' }}>{deadlineInfo.dateText}</AppText>
                  {deadlineInfo.diffDays > 0 ? (
                    <AppText variant="caption" style={{ color: colors.success, fontWeight: '600' }}>
                      {' '} (Còn {deadlineInfo.diffDays} ngày)
                    </AppText>
                  ) : null}
                </AppText>
              ) : null}
              {postedLabel ? (
                <AppText variant="caption" color="textMuted">Đăng ngày {postedLabel}</AppText>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.chipRow}>
          {job.location ? <InfoChip icon="map-pin" text={job.location} /> : null}
          {job.jobType ? <InfoChip icon="briefcase" text={getJobTypeLabelVi(job.jobType)} /> : null}
          <InfoChip icon="clock" text={experienceText} />
          {job.educationLevel ? (
            <InfoChip icon="award" text={getEducationLevelLabel(job.educationLevel)} />
          ) : null}
        </View>

        {job.description ? (
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
        ) : null}

        {job.benefits ? (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="gift" color={colors.primary} size={18} />
              <AppText variant="h3">Phúc lợi</AppText>
            </View>
            <RenderHtml
              contentWidth={width - spacing.lg * 2 - spacing.xl * 2}
              source={{ html: job.benefits }}
              tagsStyles={htmlTagsStyles}
            />
          </View>
        ) : null}

        {job.requirements ? (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="check-circle" color={colors.primary} size={18} />
              <AppText variant="h3">Kinh nghiệm / Kỹ năng chi tiết</AppText>
            </View>
            <RenderHtml
              contentWidth={width - spacing.lg * 2 - spacing.xl * 2}
              source={{ html: job.requirements }}
              tagsStyles={htmlTagsStyles}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Feather name="info" color={colors.primary} size={18} />
            <AppText variant="h3">Thông tin chi tiết</AppText>
          </View>
          <MetaRow icon="hash" label="Mã việc làm" value={String(job.jobId)} />
          <MetaRow
            icon="briefcase"
            label="Loại công việc"
            value={job.jobType ? getJobTypeLabelVi(job.jobType) : '—'}
          />
          <MetaRow icon="layers" label="Kỹ năng & mức độ" value={skillsLine} />
          <MetaRow icon="book-open" label="Học vấn" value={getEducationLevelLabel(job.educationLevel) || '—'} />
          <MetaRow icon="clock" label="Kinh nghiệm" value={experienceText} />
          <MetaRow icon="users" label="Giới tính" value={getGenderRequirementLabel(job.genderRequirement)} />
          <MetaRow icon="user" label="Tuổi" value={ageLine} />
          <MetaRow
            icon="grid"
            label="Ngành nghề"
            value={majorsLine !== '—' ? majorsLine : job.categoryName ?? '—'}
          />
          <MetaRow
            icon="globe"
            label="Ngôn ngữ nhận hồ sơ"
            value={getApplicationLanguageLabel(job.applicationLanguage)}
          />
        </View>

        {(contactName || contactAddress || contactTutorial || socials.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="phone" color={colors.primary} size={18} />
              <AppText variant="h3">Thông tin liên hệ</AppText>
            </View>
            {contactName ? <MetaRow icon="user" label="Tên liên hệ" value={contactName} /> : null}
            {contactAddress ? <MetaRow icon="map-pin" label="Địa chỉ" value={contactAddress} /> : null}
            {contactTutorial ? (
              <AppText variant="bodySm" color="textSecondary" style={{ lineHeight: 22, fontStyle: 'italic' }}>
                {contactTutorial}
              </AppText>
            ) : null}
            {socials.length > 0 ? (
              <View style={styles.socialRow}>
                {socials.map((s, idx) => (
                  <Pressable
                    key={s.id ?? idx}
                    style={styles.socialChip}
                    onPress={() => s.url && Linking.openURL(s.url)}
                  >
                    <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>
                      {getSocialPlatformLabel(s.platform)}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {(company || job.companyName) && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="home" color={colors.primary} size={18} />
              <AppText variant="h3">Về công ty</AppText>
            </View>
            <Pressable
              style={styles.companyBlock}
              onPress={() => job.companyId && navigation.navigate('CompanyDetail', { companyId: job.companyId })}
            >
              {(company?.logoUrl || job.companyLogo) ? (
                <Image source={{ uri: company?.logoUrl || job.companyLogo }} style={styles.companyLogo} />
              ) : (
                <View style={[styles.companyLogo, styles.companyLogoPlaceholder]}>
                  <Feather name="briefcase" color={colors.primary} size={24} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="h3" numberOfLines={2}>{company?.companyName || job.companyName}</AppText>
                {company?.companySize ? (
                  <AppText variant="caption" color="textMuted">Quy mô: {company.companySize}</AppText>
                ) : null}
                {company?.website ? (
                  <Pressable onPress={() => Linking.openURL(company.website!)}>
                    <AppText variant="caption" color="primary" style={{ marginTop: 4 }}>
                      {company.website}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
            {company?.description ? (
              <AppText variant="bodySm" color="textSecondary" style={{ marginTop: spacing.md, lineHeight: 22 }} numberOfLines={6}>
                {company.description.replace(/<[^>]+>/g, ' ').trim()}
              </AppText>
            ) : null}
          </View>
        )}

        {user?.profileId ? (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="target" color={colors.primary} size={18} />
              <AppText variant="h3">AI phân tích độ phù hợp</AppText>
            </View>
            <View style={styles.quotaRow}>
              <Feather name="zap" size={14} color={colors.accent} />
              <AppText variant="caption" color="textSecondary">
                Còn {remainingMatches} lượt AI Matching
              </AppText>
              {remainingMatches <= 0 ? (
                <Pressable onPress={() => navigation.navigate('Pricing')}>
                  <AppText variant="caption" color="primary" style={{ fontWeight: '700' }}>
                    Nâng cấp
                  </AppText>
                </Pressable>
              ) : null}
            </View>
            {remainingMatches <= 0 && !matchResult ? (
              <View style={styles.quotaWarn}>
                <AppText variant="bodySm" color="textSecondary" style={{ lineHeight: 20 }}>
                  Tài khoản mới không có lượt phân tích miễn phí. Mua gói ứng viên để dùng tính năng này.
                </AppText>
                <PrimaryButton
                  title="Xem gói dịch vụ"
                  onPress={() => navigation.navigate('Pricing')}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            ) : !matchResult ? (
              <PrimaryButton
                title={isMatching ? 'Đang phân tích...' : 'Phân tích CV với tin tuyển dụng'}
                onPress={handleAiMatch}
                disabled={isMatching}
              />
            ) : (
              <>
                <JobMatchResultCard result={matchResult} />
                <Pressable style={styles.rematchBtn} onPress={handleAiMatch} disabled={isMatching}>
                  <Feather name="refresh-cw" size={16} color={colors.primary} />
                  <AppText variant="bodySm" color="primary" style={{ fontWeight: '600' }}>
                    {isMatching ? 'Đang phân tích...' : 'Phân tích lại'}
                  </AppText>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        {relatedJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="layers" color={colors.primary} size={18} />
              <AppText variant="h3">Việc làm liên quan</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedJobs.map((rj) => (
                <RelatedJobCard
                  key={rj.jobId}
                  job={rj}
                  onPress={() => navigation.push('JobDetail', { jobId: rj.jobId })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {companyJobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="briefcase" color={colors.primary} size={18} />
              <AppText variant="h3">Việc làm khác tại {job.companyName}</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {companyJobs.slice(0, 12).map((cj) => (
                <RelatedJobCard
                  key={cj.jobId}
                  job={cj}
                  onPress={() => navigation.push('JobDetail', { jobId: cj.jobId })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Feather name="share-2" color={colors.primary} size={18} />
            <AppText variant="h3">Chia sẻ việc làm</AppText>
          </View>
          <View style={styles.shareRow}>
            <Pressable style={styles.shareBtn} onPress={() => openFacebookShare(buildJobShareUrl(job.jobId))}>
              <Feather name="facebook" color="#1877F2" size={22} />
              <AppText variant="caption" style={styles.shareBtnText}>Facebook</AppText>
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={() => openLinkedInShare(buildJobShareUrl(job.jobId))}>
              <Feather name="linkedin" color="#0A66C2" size={22} />
              <AppText variant="caption" style={styles.shareBtnText}>LinkedIn</AppText>
            </Pressable>
            <Pressable style={styles.shareBtn} onPress={() => shareNative(job.title, buildJobShareUrl(job.jobId))}>
              <Feather name="share" color={colors.primaryDark} size={22} />
              <AppText variant="caption" style={styles.shareBtnText}>Khác</AppText>
            </Pressable>
          </View>
        </View>
      </Animated.ScrollView>

      <ScreenOverlayHeader
        onBack={() => navigation.goBack()}
        right={
          <HeaderOverlayButton onPress={handleToggleSave}>
            <Feather name="heart" color={isSaved ? colors.danger : colors.white} size={22} />
          </HeaderOverlayButton>
        }
      />

      <View style={styles.bottomBar}>
        <Pressable onPress={handleToggleSave} style={[styles.saveBtn, isSaved && styles.saveBtnActive]}>
          <Feather name="heart" color={isSaved ? colors.danger : colors.textMuted} size={22} />
        </Pressable>
        <PrimaryButton
          title={applyLabel}
          onPress={openApplyFlow}
          disabled={isApplying || hasApplied || !available}
          style={styles.applyButton}
        />
      </View>

      <Modal visible={showApplyModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowApplyModal(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalSheetWrap}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>Ứng tuyển</AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
              Chọn CV để gửi
            </AppText>
            {resumes.map((r) => (
              <Pressable
                key={r.resumeId}
                style={[styles.resumeOption, selectedResumeId === r.resumeId && styles.resumeOptionActive]}
                onPress={() => setSelectedResumeId(r.resumeId)}
              >
                <Feather
                  name={selectedResumeId === r.resumeId ? 'check-circle' : 'circle'}
                  size={20}
                  color={selectedResumeId === r.resumeId ? colors.primary : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySm" style={{ fontWeight: '600' }}>
                    {r.resumeName || r.title}
                  </AppText>
                  {r.isPrimary ? (
                    <AppText variant="caption" color="primary">CV chính</AppText>
                  ) : null}
                </View>
              </Pressable>
            ))}
            <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              Thư giới thiệu (tùy chọn)
            </AppText>
            <TextInput
              style={styles.coverInput}
              placeholder="Viết vài dòng giới thiệu bản thân..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={coverLetter}
              onChangeText={setCoverLetter}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <PrimaryButton
                title="Hủy"
                onPress={() => setShowApplyModal(false)}
                style={[styles.modalBtn, { backgroundColor: colors.background }]}
              />
              <PrimaryButton
                title={isApplying ? 'Đang gửi...' : 'Gửi hồ sơ'}
                onPress={submitApply}
                disabled={isApplying}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  headerGradient: {
    paddingTop: HEADER_SAFE_TOP + 48,
    paddingHorizontal: spacing.lg,
    flex: 1,
  },
  heroContent: { gap: spacing.sm, flex: 1, justifyContent: 'flex-end', paddingBottom: 20 },
  heroTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  companyLogoSmall: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.white },
  companyLogoPlaceholder: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
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
  dateRow: { marginTop: spacing.sm, gap: 4 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  companyBlock: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  companyLogo: { width: 56, height: 56, borderRadius: 12 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  socialChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: zIndex.bottomBar,
    elevation: zIndex.bottomBar,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingBottom: 24,
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
  shareRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
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
  rematchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  quotaWarn: {
    backgroundColor: colors.accent + '12',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '35',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheetWrap: { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  resumeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  resumeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  coverInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 88,
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalBtn: { flex: 1 },
});

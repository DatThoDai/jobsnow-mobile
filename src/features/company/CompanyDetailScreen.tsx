import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Animated, Pressable, Image, Platform, Modal, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { Company, CompanyReview, Job } from '../../services/api/models';
import { companyService } from '../../services/api/companyService';

type RouteProps = RouteProp<RootStackParamList, 'CompanyDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function CompanyLogo({ uri, size = 64 }: { uri?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.white }} resizeMode="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="briefcase" color={colors.primary} size={size * 0.45} />
    </View>
  );
}

export function CompanyDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    pros: '',
    cons: '',
    recommend: true,
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 220;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerZindex = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [100, 100], // Keep it always on top
    extrapolate: 'clamp',
  });

  const bannerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [companyData, jobsData, followStatus, reviewsData] = await Promise.all([
          companyService.getCompanyById(route.params.companyId),
          companyService.getCompanyJobs(route.params.companyId),
          companyService.isFollowing(route.params.companyId).catch(() => false),
          companyService.getReviews(route.params.companyId).catch(() => ({ content: [] })),
        ]);
        setCompany(companyData);
        setJobs(jobsData || []);
        setIsFollowing(followStatus as boolean);
        setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData?.items || reviewsData?.content || []));
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [route.params.companyId]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await companyService.unfollowCompany(route.params.companyId);
      } else {
        await companyService.followCompany(route.params.companyId);
      }
      setIsFollowing(!isFollowing);
    } catch (e) {}
  };

  const handleReview = () => {
    setReviewForm({ rating: 5, title: '', pros: '', cons: '', recommend: true });
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!reviewForm.title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề đánh giá.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await companyService.createReview(route.params.companyId, {
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        pros: reviewForm.pros.trim(),
        cons: reviewForm.cons.trim(),
        recommend: reviewForm.recommend,
      });
      setReviewModalVisible(false);
      const reviewsData = await companyService.getReviews(route.params.companyId);
      setReviews(Array.isArray(reviewsData) ? reviewsData : (reviewsData?.items || reviewsData?.content || []));
      Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi.');
    } catch (e: unknown) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể gửi đánh giá.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const formatSalary = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return 'Thương lượng';
    const fmt = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(0)}tr`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
      return `${n}`;
    };
    const currency = job.salaryCurrency || 'VND';
    if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)} ${currency}`;
    if (job.salaryMin) return `Từ ${fmt(job.salaryMin)} ${currency}`;
    return `Đến ${fmt(job.salaryMax!)} ${currency}`;
  };

  if (isLoading || !company) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal visible={!!viewerImage} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setViewerImage(null)}>
            <Feather name="x" size={30} color="#fff" />
          </TouchableOpacity>
          {viewerImage && <Image source={{ uri: viewerImage }} style={styles.fullImage} resizeMode="contain" />}
        </View>
      </Modal>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_MAX_HEIGHT + 20 }]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <View style={styles.infoCard}>
          <View style={styles.heroHeader}>
            <View style={styles.logoWrap}>
              <CompanyLogo uri={company.logoUrl} size={80} />
            </View>
            <View style={styles.heroText}>
              <AppText variant="h2" numberOfLines={2}>{company.companyName}</AppText>
              <View style={styles.statsRow}>
                <AppText variant="caption" color="primary">{jobs.length} việc làm</AppText>
                <View style={styles.dot} />
                <AppText variant="caption" color="textSecondary">{company.followerCount || 0} người theo dõi</AppText>
              </View>
            </View>
          </View>

          <View style={styles.chipRow}>
            {company.address && (
              <View style={styles.chip}>
                <Feather name="map-pin" color={colors.primary} size={14} />
                <AppText variant="caption" color="textSecondary" style={{ flex: 1 }} numberOfLines={2}>{company.address}</AppText>
              </View>
            )}
            <View style={styles.chip}>
              <Feather name="users" color={colors.primary} size={14} />
              <AppText variant="caption" color="textSecondary">{company.companySize || '1000+'} nhân viên</AppText>
            </View>
            {company.website && (
              <View style={styles.chip}>
                <Feather name="globe" color={colors.primary} size={14} />
                <AppText variant="caption" color="primary" numberOfLines={1}>{company.website}</AppText>
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <PrimaryButton
              title={isFollowing ? 'Đang theo dõi' : 'Theo dõi công ty'}
              onPress={toggleFollow}
              variant="primary"
              leftIcon={isFollowing ? 'check' : 'heart'}
              style={styles.actionBtn}
            />
            <PrimaryButton
              title="Viết đánh giá"
              onPress={handleReview}
              variant="outline"
              leftIcon="edit-3"
              style={styles.actionBtn}
            />
          </View>
        </View>

        {company.images && company.images.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="image" color={colors.primary} size={18} />
              <AppText variant="h3">Hình ảnh công ty</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery} contentContainerStyle={{ gap: 12 }}>
              {company.images.map((img, idx) => (
                <Pressable key={idx} onPress={() => setViewerImage(img.imageUrl)}>
                  <Image source={{ uri: img.imageUrl }} style={styles.galleryImg} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {company.description && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="info" color={colors.primary} size={18} />
              <AppText variant="h3">Giới thiệu công ty</AppText>
            </View>
            <AppText variant="body" color="textSecondary" style={{ lineHeight: 24 }}>{company.description}</AppText>
          </View>
        )}

        {jobs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Feather name="briefcase" color={colors.primary} size={18} />
              <AppText variant="h3">Việc làm đang tuyển</AppText>
            </View>
            {jobs.map(job => (
              <Pressable key={job.jobId} style={styles.jobCard} onPress={() => navigation.navigate('JobDetail', { jobId: job.jobId })}>
                <View style={styles.jobCardTop}>
                  <View style={styles.jobCardInfo}>
                    <AppText variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '700' }}>{job.title}</AppText>
                    <View style={styles.jobMetaRow}>
                      <AppText variant="caption" color="primary" style={{ fontWeight: '700' }}>{formatSalary(job)}</AppText>
                      <AppText variant="caption" color="textMuted">{job.location}</AppText>
                    </View>
                  </View>
                  <Feather name="chevron-right" color={colors.primary} size={20} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Feather name="star" color={colors.primary} size={18} />
            <AppText variant="h3">Đánh giá</AppText>
          </View>
          {reviews.length > 0 ? (
            reviews.map(review => (
              <View key={review.reviewId} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <AppText variant="body" style={styles.reviewTitle} numberOfLines={1}>{review.title}</AppText>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Feather key={s} name="star" size={13} color={s <= review.rating ? colors.accent : colors.border} />
                    ))}
                  </View>
                </View>
                
                <View style={styles.reviewDetails}>
                  {review.pros && (
                    <View style={styles.detailItem}>
                      <AppText variant="caption" color="success" style={{ fontWeight: '700' }}>Ưu điểm:</AppText>
                      <AppText variant="bodySm" color="textSecondary" style={{ marginTop: 2 }}>{review.pros}</AppText>
                    </View>
                  )}
                  {review.cons && (
                    <View style={styles.detailItem}>
                      <AppText variant="caption" color="error" style={{ fontWeight: '700' }}>Nhược điểm:</AppText>
                      <AppText variant="bodySm" color="textSecondary" style={{ marginTop: 2 }}>{review.cons}</AppText>
                    </View>
                  )}
                </View>

                <View style={styles.reviewFooter}>
                  <AppText variant="caption" color="textMuted">
                    {review.recommend ? '✅ Khuyên làm' : '❌ Cân nhắc'}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    Bởi: {review.userName || 'Người dùng'}
                  </AppText>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyReviews}>
              <Feather name="message-square" color={colors.border} size={40} />
              <AppText variant="bodySm" color="textMuted" style={{ marginTop: 8 }}>Chưa có đánh giá nào cho công ty này.</AppText>
              <Pressable onPress={handleReview} style={{ marginTop: 12 }}>
                <AppText variant="bodySm" color="primary" style={{ fontWeight: '700' }}>Viết đánh giá ngay</AppText>
              </Pressable>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      <Animated.View
        style={[styles.headerWrap, { height: headerHeight, zIndex: headerZindex }]}
        pointerEvents="box-none"
      >
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, opacity: bannerOpacity }}>
          {company.bannerUrl ? (
            <Image
              source={{ uri: company.bannerUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />
        </Animated.View>
      </Animated.View>

      <View style={styles.backOverlay} pointerEvents="box-none">
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="arrow-left" color={colors.white} size={22} />
        </Pressable>
      </View>

      <Modal visible={reviewModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.reviewModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.reviewModalOverlay}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.reviewModalSheet}>
            <View style={styles.reviewModalHandle} />
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>
              Viết đánh giá
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginBottom: spacing.sm }}>
              Đánh giá của bạn
            </AppText>
            <View style={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setReviewForm((f) => ({ ...f, rating: star }))}
                  hitSlop={8}
                >
                  <Feather
                    name="star"
                    size={28}
                    color={star <= reviewForm.rating ? colors.accent : colors.border}
                  />
                </Pressable>
              ))}
            </View>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.md }}>
              Tiêu đề *
            </AppText>
            <TextInput
              style={styles.reviewInput}
              placeholder="Tiêu đề đánh giá"
              placeholderTextColor={colors.textMuted}
              value={reviewForm.title}
              onChangeText={(t) => setReviewForm((f) => ({ ...f, title: t }))}
            />
            <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
              Ưu điểm
            </AppText>
            <TextInput
              style={[styles.reviewInput, styles.reviewInputMultiline]}
              placeholder="Điều bạn thích..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={reviewForm.pros}
              onChangeText={(t) => setReviewForm((f) => ({ ...f, pros: t }))}
            />
            <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.sm }}>
              Nhược điểm
            </AppText>
            <TextInput
              style={[styles.reviewInput, styles.reviewInputMultiline]}
              placeholder="Điều cần cải thiện..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={reviewForm.cons}
              onChangeText={(t) => setReviewForm((f) => ({ ...f, cons: t }))}
            />
            <Pressable
              style={styles.recommendRow}
              onPress={() => setReviewForm((f) => ({ ...f, recommend: !f.recommend }))}
            >
              <Feather
                name={reviewForm.recommend ? 'check-square' : 'square'}
                size={22}
                color={colors.primaryDark}
              />
              <AppText variant="bodySm" style={{ marginLeft: spacing.sm }}>
                Tôi khuyên làm việc tại công ty này
              </AppText>
            </Pressable>
            <View style={styles.reviewModalActions}>
              <PrimaryButton
                title="Hủy"
                variant="outline"
                onPress={() => setReviewModalVisible(false)}
                style={{ flex: 1 }}
                disabled={reviewSubmitting}
              />
              <PrimaryButton
                title={reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                onPress={submitReview}
                style={{ flex: 1 }}
                disabled={reviewSubmitting}
              />
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    elevation: 4,
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    elevation: 12,
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 80, paddingHorizontal: spacing.lg },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...shadows.md,
    zIndex: 1,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  logoWrap: {
    padding: 4, backgroundColor: colors.white, borderRadius: radius.lg, ...shadows.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  heroText: { flex: 1, gap: 2 },
  chipRow: { gap: spacing.sm, marginBottom: spacing.xl },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  actionBtn: { flex: 1, minHeight: 48 },
  reviewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  reviewModalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    maxHeight: '90%',
  },
  reviewModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  ratingPicker: { flexDirection: 'row', gap: spacing.sm },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  reviewInputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  recommendRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  reviewModalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  emptyReviews: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  section: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl,
    marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  gallery: { marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl },
  galleryImg: { width: 140, height: 100, borderRadius: radius.lg, marginRight: spacing.sm, backgroundColor: colors.surfaceAlt },
  jobCard: {
    backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  jobCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  jobCardInfo: { flex: 1, gap: 4 },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewCard: {
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm, gap: spacing.sm, backgroundColor: colors.background,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  ratingRow: { flexDirection: 'row', gap: 2, flexShrink: 0, flexWrap: 'nowrap' },
  reviewTitle: { fontWeight: '700', flex: 1, color: colors.textPrimary },
  reviewDetails: { gap: spacing.xs, marginTop: 4 },
  detailItem: { gap: 2 },
  reviewFooter: { 
    marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, 
    paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' 
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.border },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  fullImage: { width: '100%', height: '80%' },
});

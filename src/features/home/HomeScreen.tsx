import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  Image,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { useJobStore } from '../../stores/useJobStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Job } from '../../services/api/models';
import { companyService } from '../../services/api/companyService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

function formatSalary(job: Job): string {
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
}

function CompanyLogo({ uri, size = 40 }: { uri?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.surfaceAlt }} resizeMode="contain" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="briefcase" color={colors.primary} size={size * 0.45} />
    </View>
  );
}

import { ImageBackground } from 'react-native';

function FeaturedJobCard({ job, onPress }: { job: Job; onPress: () => void }) {
  const content = (
    <>
      <View style={fStyles.topRow}>
        <CompanyLogo uri={job.companyLogo} size={36} />
        {job.hotTag && job.hotTag !== 'NORMAL' && (
          <View style={fStyles.hotBadge}>
            <Feather name="zap" color={colors.accent} size={10} />
            <AppText variant="caption" style={{ color: colors.accent, fontSize: 10 }}>{job.hotTag}</AppText>
          </View>
        )}
      </View>
      <View style={fStyles.contentBottom}>
        <AppText variant="h3" color="white" numberOfLines={2} style={fStyles.title}>{job.title}</AppText>
        <AppText variant="bodySm" style={fStyles.company} numberOfLines={1}>{job.companyName}</AppText>
        <View style={fStyles.metaRow}>
          <Feather name="map-pin" color="rgba(255,255,255,0.7)" size={12} />
          <AppText variant="caption" style={fStyles.metaText} numberOfLines={1}>{job.location}</AppText>
        </View>
        <View style={fStyles.salaryPill}>
          <AppText variant="caption" color="primary" style={{ fontWeight: '700', fontSize: 12 }}>{formatSalary(job)}</AppText>
        </View>
      </View>
    </>
  );

  return (
    <Pressable onPress={onPress} style={fStyles.card}>
      {job.thumbnailUrl ? (
        <ImageBackground source={{ uri: job.thumbnailUrl }} style={fStyles.gradient} imageStyle={{ borderRadius: radius.xl }}>
          <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
          {content}
        </ImageBackground>
      ) : (
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={fStyles.gradient}>
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const CARD_WIDTH = width * 0.72;
const fStyles = StyleSheet.create({
  card: { width: CARD_WIDTH, marginRight: spacing.md, borderRadius: radius.xl, ...shadows.md, backgroundColor: colors.surface, overflow: 'hidden' },
  gradient: { flex: 1, padding: spacing.lg, minHeight: 190, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  hotBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  title: { marginBottom: spacing.xs },
  company: { color: 'rgba(255,255,255,0.8)', marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  metaText: { color: 'rgba(255,255,255,0.7)', flex: 1 },
  salaryPill: { alignSelf: 'flex-start', backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  contentBottom: { justifyContent: 'flex-end' },
});

function LatestJobRow({ job, onPress }: { job: Job; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={lStyles.row}>
      <CompanyLogo uri={job.companyLogo} size={44} />
      <View style={lStyles.info}>
        <AppText variant="body" numberOfLines={2} style={{ fontWeight: '600', lineHeight: 20 }}>{job.title}</AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>{job.companyName}</AppText>
        <View style={lStyles.metaRow}>
          <View style={lStyles.chip}>
            <Feather name="map-pin" color={colors.textMuted} size={10} />
            <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ flex: 1 }}>{job.location}</AppText>
          </View>
          <AppText variant="caption" color="primary" style={{ fontWeight: '700' }}>{formatSalary(job)}</AppText>
        </View>
      </View>
      <Feather name="chevron-right" color={colors.textMuted} size={18} />
    </Pressable>
  );
}

const lStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  info: { flex: 1, gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
});

function CompanySlider({ companies }: { companies: any[] }) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const itemWidth = 84; // 56 (size) + 28 (margin)

  useEffect(() => {
    if (companies.length > 0) {
      scrollX.setValue(0);
      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -companies.length * itemWidth,
          duration: companies.length * 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [companies]);

  if (companies.length === 0) return null;

  // Triple items for perfectly seamless loop
  const displayCompanies = [...companies, ...companies, ...companies];

  return (
    <View style={styles.sliderContainer}>
      <Animated.View style={[styles.marquee, { transform: [{ translateX: scrollX }] }]}>
        {displayCompanies.map((item, index) => (
          <Pressable key={`${item.companyId}-${index}`} style={[styles.logoItem, { width: 56, marginRight: 28 }]}>
            <CompanyLogo uri={item.logoUrl || item.logo_url || item.logo} size={56} />
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

export function HomeScreen() {
  const { featuredJobs, latestJobs, isLoading, fetchHomeJobs } = useJobStore();
  const { user } = useAuthStore();
  const [vipCompanies, setVipCompanies] = useState<any[]>([]);
  const navigation = useNavigation<NavigationProp>();
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(heroTranslate, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    fetchHomeJobs();
    
    companyService.getVipCompanies(1, 10).then(setVipCompanies).catch(() => {});
  }, [heroOpacity, heroTranslate, fetchHomeJobs]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <Screen scroll>
      <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslate }] }}>
        <View style={styles.topBar}>
          <View style={styles.greetingCol}>
            <AppText variant="bodySm" color="textMuted">{greeting()}</AppText>
            <AppText variant="h2" numberOfLines={1}>{user?.fullName || 'Người dùng'} 👋</AppText>
          </View>
          <Pressable onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
            <Feather name="bell" color={colors.textPrimary} size={20} />
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Search' as any)} style={styles.searchBar}>
          <Feather name="search" color={colors.textMuted} size={18} />
          <AppText variant="bodySm" color="textMuted">Tìm việc, công ty, kỹ năng...</AppText>
        </Pressable>
      </Animated.View>

      <CompanySlider companies={vipCompanies} />

      <View style={styles.sectionHeader}>
        <AppText variant="h3">🔥 Việc làm nổi bật</AppText>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing['2xl'] }} />
      ) : (
        <FlatList
          data={featuredJobs}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.jobId.toString()}
          contentContainerStyle={{ paddingRight: spacing.lg }}
          renderItem={({ item }) => (
            <FeaturedJobCard job={item} onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })} />
          )}
        />
      )}

      <View style={styles.sectionHeader}>
        <AppText variant="h3">🏆 Top Công ty nổi bật</AppText>
        <Pressable onPress={() => {}}>
          <AppText variant="caption" color="primary">Xem tất cả</AppText>
        </Pressable>
      </View>

      <View style={styles.rankingGrid}>
        {vipCompanies.slice(0, 4).map((company, index) => {
          const bannerUrl = company.banner_url || company.bannerUrl || company.banner;
          const logoUrl = company.logoUrl || company.logo_url || company.logo;
          
          return (
            <Pressable 
              key={company.companyId} 
              style={styles.rankingCard}
              onPress={() => navigation.navigate('CompanyDetail', { companyId: company.companyId })}
            >
              {bannerUrl ? (
                <ImageBackground source={{ uri: bannerUrl }} style={styles.cardBanner} resizeMode="cover">
                  <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject} />
                  <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.sm }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: radius.md, padding: 4, marginBottom: spacing.xs }}>
                      <CompanyLogo uri={logoUrl} size={44} />
                    </View>
                    <AppText variant="bodySm" numberOfLines={1} style={{ fontWeight: '700', color: '#fff', textAlign: 'center' }}>{company.companyName}</AppText>
                    <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {company.industryName || company.category || company.industry || 'Đa ngành'}
                    </AppText>
                  </View>
                </ImageBackground>
              ) : (
                <View style={{ padding: spacing.md, alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                  <CompanyLogo uri={logoUrl} size={48} />
                  <AppText variant="bodySm" numberOfLines={1} style={{ fontWeight: '700', marginTop: spacing.xs, textAlign: 'center' }}>{company.companyName}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {company.industryName || company.category || company.industry || 'Đa ngành'}
                  </AppText>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="h3">⚡ Mới nhất cho bạn</AppText>
        <Pressable onPress={fetchHomeJobs}>
          <AppText variant="caption" color="primary">Làm mới</AppText>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : latestJobs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="inbox" color={colors.textMuted} size={40} />
          <AppText variant="bodySm" color="textMuted">Chưa có việc làm mới</AppText>
        </View>
      ) : (
        latestJobs.map((job) => (
          <LatestJobRow key={job.jobId} job={job} onPress={() => navigation.navigate('JobDetail', { jobId: job.jobId })} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greetingCol: { flex: 1, gap: 2 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    marginVertical: spacing.lg,
    paddingVertical: spacing.sm,
  },
  logoItem: {
    alignItems: 'center',
  },
  marquee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  rankingCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
    height: 120,
  },
  cardBanner: {
    width: '100%',
    height: '100%',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.sm,
  },
});

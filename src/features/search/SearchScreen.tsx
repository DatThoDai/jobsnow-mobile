import React, { useState } from 'react';
import { StyleSheet, View, TextInput, ActivityIndicator, FlatList, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { jobService } from '../../services/api/jobService';
import { Job } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function CompanyLogo({ uri, size = 48 }: { uri?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.surfaceAlt }} resizeMode="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="briefcase" color={colors.primary} size={size * 0.45} />
    </View>
  );
}

export function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsLoading(true);
    try {
      const results = await jobService.searchJobs(keyword);
      setJobs(results);
    } catch (error) {
    } finally {
      setIsLoading(false);
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

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="h1">Tìm kiếm</AppText>
        <AppText variant="bodySm" color="textSecondary" style={styles.subtitle}>
          Khám phá cơ hội nghề nghiệp tại các công ty hàng đầu.
        </AppText>
      </View>

      <View style={styles.searchBarContainer}>
        <Feather name="search" color={colors.primary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tên công việc, công ty, kỹ năng..."
          placeholderTextColor={colors.textMuted}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {keyword.length > 0 && (
          <Pressable onPress={() => { setKeyword(''); setJobs([]); }}>
            <Feather name="x-circle" color={colors.textMuted} size={20} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.jobId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="search" color={colors.textMuted} size={48} />
              <AppText variant="body" color="textMuted" style={{ marginTop: spacing.md }}>
                {keyword ? 'Không tìm thấy kết quả phù hợp.' : 'Nhập từ khóa để bắt đầu tìm kiếm.'}
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })}
            >
              <View style={styles.cardTop}>
                <CompanyLogo uri={item.companyLogo} />
                <View style={styles.cardInfo}>
                  <AppText variant="body" style={styles.jobTitle} numberOfLines={2}>{item.title}</AppText>
                  <AppText variant="caption" color="textSecondary" numberOfLines={1}>{item.companyName}</AppText>
                </View>
                {item.hotTag && item.hotTag !== 'NORMAL' && (
                  <View style={styles.hotBadge}>
                    <Feather name="zap" color={colors.accent} size={10} />
                    <AppText variant="caption" style={{ color: colors.accent, fontSize: 10 }}>{item.hotTag}</AppText>
                  </View>
                )}
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <Feather name="map-pin" color={colors.textMuted} size={10} />
                    <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ flex: 1 }}>{item.location}</AppText>
                  </View>
                  <View style={styles.chip}>
                    <Feather name="briefcase" color={colors.textMuted} size={10} />
                    <AppText variant="caption" color="textMuted">{item.jobType || 'Toàn thời gian'}</AppText>
                  </View>
                </View>
                <AppText variant="caption" color="primary" style={{ fontWeight: '700', marginTop: spacing.sm }}>{formatSalary(item)}</AppText>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.xs },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.primary + '30',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 50, fontFamily: fontFamilies.body, fontSize: 16, color: colors.textPrimary },
  listContent: { paddingBottom: spacing['3xl'] },
  center: { paddingTop: spacing['3xl'], alignItems: 'center' },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardInfo: { flex: 1, gap: 2 },
  jobTitle: { fontWeight: '600', lineHeight: 20 },
  hotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(225, 180, 107, 0.15)',
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill,
  },
  cardBottom: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
});

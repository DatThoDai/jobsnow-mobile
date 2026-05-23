import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  FlatList,
  Pressable,
  Image,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { jobService } from '../../services/api/jobService';
import { categoryService } from '../../services/api/categoryService';
import { Job, JobCategory } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const JOB_TYPES = [
  { label: 'Tất cả', value: '' },
  { label: 'Toàn thời gian', value: 'FULL_TIME' },
  { label: 'Bán thời gian', value: 'PART_TIME' },
  { label: 'Thực tập', value: 'INTERNSHIP' },
  { label: 'Hợp đồng', value: 'CONTRACT' },
  { label: 'Từ xa', value: 'REMOTE' },
];

function CompanyLogo({ uri, size = 48 }: { uri?: string; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.surfaceAlt }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name="briefcase" color={colors.primary} size={size * 0.45} />
    </View>
  );
}

export function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    categoryService.getAllCategories().then(setCategories).catch(() => {});
  }, []);

  const selectedCategory = categories.find((c) => c.categoryId === categoryId);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await jobService.searchJobs({
        keyword: keyword.trim() || undefined,
        location: location.trim() || undefined,
        jobType: jobType || undefined,
        categoryName: selectedCategory?.categoryName,
      });
      setJobs(results);
    } catch {
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setLocation('');
    setJobType('');
    setCategoryId(null);
  };

  const hasActiveFilters = Boolean(location || jobType || categoryId);

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
        <Pressable onPress={() => setShowFilters(true)} style={styles.filterBtn}>
          <Feather name="sliders" color={hasActiveFilters ? colors.primary : colors.textMuted} size={20} />
        </Pressable>
      </View>

      {hasActiveFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {location ? (
            <FilterChip label={location} onRemove={() => setLocation('')} />
          ) : null}
          {jobType ? (
            <FilterChip
              label={JOB_TYPES.find((t) => t.value === jobType)?.label ?? jobType}
              onRemove={() => setJobType('')}
            />
          ) : null}
          {selectedCategory ? (
            <FilterChip label={selectedCategory.categoryName} onRemove={() => setCategoryId(null)} />
          ) : null}
        </ScrollView>
      )}

      <Pressable style={styles.searchAction} onPress={handleSearch}>
        <AppText variant="bodySm" color="primary" style={{ fontWeight: '600' }}>
          Tìm kiếm ngay
        </AppText>
      </Pressable>

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
                {keyword || hasActiveFilters
                  ? 'Không tìm thấy kết quả phù hợp.'
                  : 'Nhập từ khóa hoặc bấm tìm kiếm.'}
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
                  <AppText variant="body" style={styles.jobTitle} numberOfLines={2}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                    {item.companyName}
                  </AppText>
                </View>
                {item.hotTag && item.hotTag !== 'NORMAL' && (
                  <View style={styles.hotBadge}>
                    <Feather name="zap" color={colors.accent} size={10} />
                    <AppText variant="caption" style={{ color: colors.accent, fontSize: 10 }}>
                      {item.hotTag}
                    </AppText>
                  </View>
                )}
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <Feather name="map-pin" color={colors.textMuted} size={10} />
                    <AppText variant="caption" color="textMuted" numberOfLines={1} style={{ flex: 1 }}>
                      {item.location}
                    </AppText>
                  </View>
                  <View style={styles.chip}>
                    <Feather name="briefcase" color={colors.textMuted} size={10} />
                    <AppText variant="caption" color="textMuted">
                      {item.jobType || 'Toàn thời gian'}
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color="primary" style={{ fontWeight: '700', marginTop: spacing.sm }}>
                  {formatSalary(item)}
                </AppText>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <KeyboardAvoidingView
          style={styles.filterModalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilters(false)} />
        <View style={styles.filterSheet}>
          <View style={styles.sheetHandle} />
          <AppText variant="h3" style={{ marginBottom: spacing.lg }}>Bộ lọc</AppText>

          <AppText variant="caption" color="textSecondary" style={styles.filterLabel}>
            ĐỊA ĐIỂM
          </AppText>
          <TextInput
            style={styles.filterInput}
            placeholder="VD: Hà Nội, TP.HCM"
            placeholderTextColor={colors.textMuted}
            value={location}
            onChangeText={setLocation}
          />

          <AppText variant="caption" color="textSecondary" style={styles.filterLabel}>
            LOẠI HÌNH
          </AppText>
          <View style={styles.typeGrid}>
            {JOB_TYPES.map((t) => (
              <Pressable
                key={t.value || 'all'}
                style={[styles.typeChip, jobType === t.value && styles.typeChipActive]}
                onPress={() => setJobType(t.value)}
              >
                <AppText
                  variant="caption"
                  color="textSecondary"
                  style={{ fontSize: 12, color: jobType === t.value ? colors.white : colors.textSecondary }}
                >
                  {t.label}
                </AppText>
              </Pressable>
            ))}
          </View>

          <AppText variant="caption" color="textSecondary" style={styles.filterLabel}>
            NGÀNH NGHỀ
          </AppText>
          <ScrollView style={{ maxHeight: 140 }} nestedScrollEnabled>
            <Pressable
              style={[styles.typeChip, categoryId === null && styles.typeChipActive, { marginBottom: spacing.xs }]}
              onPress={() => setCategoryId(null)}
            >
              <AppText
                variant="caption"
                color="textSecondary"
                style={{ color: categoryId === null ? colors.white : colors.textSecondary }}
              >
                Tất cả
              </AppText>
            </Pressable>
            {categories.map((c) => (
              <Pressable
                key={c.categoryId}
                style={[styles.typeChip, categoryId === c.categoryId && styles.typeChipActive, { marginBottom: spacing.xs }]}
                onPress={() => setCategoryId(c.categoryId)}
              >
                <AppText
                  variant="caption"
                  color="textSecondary"
                  style={{ color: categoryId === c.categoryId ? colors.white : colors.textSecondary }}
                >
                  {c.categoryName}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.filterActions}>
            <Pressable onPress={clearFilters} style={styles.clearBtn}>
              <AppText variant="bodySm" color="textSecondary">Xóa bộ lọc</AppText>
            </Pressable>
            <PrimaryButton
              title="Áp dụng"
              onPress={() => {
                setShowFilters(false);
                handleSearch();
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.activeChip}>
      <AppText variant="caption" color="primary" style={{ fontSize: 12 }}>
        {label}
      </AppText>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Feather name="x" color={colors.primary} size={14} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.xs },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, height: 50, fontFamily: fontFamilies.body, fontSize: 16, color: colors.textPrimary },
  filterBtn: { padding: spacing.xs },
  chipsRow: { marginBottom: spacing.sm, maxHeight: 36 },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  searchAction: { alignSelf: 'flex-end', marginBottom: spacing.md },
  listContent: { paddingBottom: spacing['3xl'] },
  center: { paddingTop: spacing['3xl'], alignItems: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardInfo: { flex: 1, gap: 2 },
  jobTitle: { fontWeight: '600', lineHeight: 20 },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(225, 180, 107, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  cardBottom: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  filterModalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  filterSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  filterLabel: { marginBottom: spacing.xs, marginTop: spacing.md, fontWeight: '600', letterSpacing: 0.5 },
  filterInput: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  clearBtn: { paddingVertical: spacing.md },
});

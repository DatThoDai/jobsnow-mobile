import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { savedJobService } from '../../services/api/savedJobService';
import { useAuthStore } from '../../stores/useAuthStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { SavedJob } from '../../services/api/models';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function CompanyLogo({ uri, size = 44 }: { uri?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.surfaceAlt }} resizeMode="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="briefcase" color={colors.primary} size={size * 0.45} />
    </View>
  );
}

export function SavedScreen() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();

  const fetchSaved = useCallback(async () => {
    if (!user?.profileId) return;
    setIsLoading(true);
    try {
      const data = await savedJobService.getSavedJobs(user.profileId);
      setSavedJobs(data || []);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }, [user?.profileId]);

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [fetchSaved])
  );

  const handleUnsave = async (profileId: number, jobId: number) => {
    try {
      await savedJobService.unsaveJob(profileId, jobId);
      setSavedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (e) {}
  };

  const formatSalary = (item: SavedJob) => {
    if (!item.salaryMin && !item.salaryMax) return 'Thương lượng';
    const fmt = (n: number) => {
      if (n >= 1000000) return `${(n / 1000000).toFixed(0)}tr`;
      if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
      return `${n}`;
    };
    const currency = item.salaryCurrency || 'VND';
    if (item.salaryMin && item.salaryMax) return `${fmt(item.salaryMin)} - ${fmt(item.salaryMax)} ${currency}`;
    if (item.salaryMin) return `Từ ${fmt(item.salaryMin)} ${currency}`;
    return `Đến ${fmt(item.salaryMax!)} ${currency}`;
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Feather name="heart" color={colors.primary} size={28} />
        <AppText variant="h1">Đã lưu</AppText>
      </View>
      <AppText variant="bodySm" color="textSecondary" style={styles.subtitle}>
        Danh sách các cơ hội việc làm bạn đang quan tâm.
      </AppText>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={savedJobs}
          keyExtractor={(item) => item.savedJobId?.toString() || item.jobId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="heart" color={colors.textMuted} size={48} />
              <AppText variant="h3" color="textMuted" style={styles.emptyTitle}>
                Chưa lưu việc làm nào
              </AppText>
              <AppText variant="bodySm" color="textMuted" style={styles.emptySubtitle}>
                Nhấn biểu tượng trái tim trên việc làm để lưu lại và xem sau.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('JobDetail', { jobId: item.jobId })}
            >
              <CompanyLogo uri={item.companyLogo} />
              <View style={styles.cardContent}>
                <AppText variant="body" style={styles.jobTitle} numberOfLines={2}>{item.jobTitle || (item as any).title}</AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={1}>{item.companyName}</AppText>
                <View style={styles.metaRow}>
                  <View style={styles.chip}>
                    <Feather name="map-pin" color={colors.textMuted} size={10} />
                    <AppText variant="caption" color="textMuted" numberOfLines={1}>{item.location}</AppText>
                  </View>
                  {item.jobType && (
                    <View style={styles.chip}>
                      <Feather name="briefcase" color={colors.textMuted} size={10} />
                      <AppText variant="caption" color="textMuted" numberOfLines={1}>{item.jobType}</AppText>
                    </View>
                  )}
                  <AppText variant="caption" color="primary" style={{ fontWeight: '700', marginLeft: 'auto' }}>{formatSalary(item)}</AppText>
                </View>
              </View>
              <Pressable
                style={styles.unsaveBtn}
                onPress={() => handleUnsave(user!.profileId!, item.jobId)}
              >
                <Feather name="trash-2" color={colors.danger} size={18} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  cardContent: { flex: 1, gap: 3 },
  jobTitle: { fontWeight: '600', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  unsaveBtn: { padding: spacing.sm, backgroundColor: '#FEF2F2', borderRadius: radius.md, marginLeft: spacing.xs },
  emptyState: { alignItems: 'center', paddingTop: spacing['3xl'], gap: spacing.md },
  emptyTitle: { marginTop: spacing.sm },
  emptySubtitle: { textAlign: 'center', maxWidth: 280, lineHeight: 20 },
});

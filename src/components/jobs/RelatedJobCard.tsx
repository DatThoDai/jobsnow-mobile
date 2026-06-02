import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { HotTagBadge } from './HotTagBadge';
import { Job } from '../../services/api/models';
import { formatJobSalary } from '../../utils/jobDetailFormat';
import { colors, radius, shadows, spacing } from '../../theme';

interface RelatedJobCardProps {
  job: Job;
  onPress: () => void;
  width?: number;
}

export function RelatedJobCard({ job, onPress, width = 260 }: RelatedJobCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, { width }]}>
      {job.hotTag && job.hotTag !== 'NORMAL' ? (
        <View style={styles.hotWrap}>
          <HotTagBadge tag={job.hotTag} compact />
        </View>
      ) : null}
      <View style={styles.logoRow}>
        {job.companyLogo ? (
          <Image source={{ uri: job.companyLogo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Feather name="briefcase" size={16} color={colors.primary} />
          </View>
        )}
        <AppText variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
          {job.companyName}
        </AppText>
      </View>
      <AppText variant="bodySm" style={styles.title} numberOfLines={2}>
        {job.title}
      </AppText>
      <AppText variant="caption" color="textMuted" numberOfLines={1}>
        {job.location || '—'}
      </AppText>
      <AppText variant="caption" style={styles.salary} numberOfLines={1}>
        {formatJobSalary(job)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  hotWrap: { marginBottom: spacing.xs },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logo: { width: 32, height: 32, borderRadius: 8 },
  logoPlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '600', marginBottom: spacing.xs, minHeight: 40 },
  salary: { color: colors.success, fontWeight: '600', marginTop: spacing.xs },
});

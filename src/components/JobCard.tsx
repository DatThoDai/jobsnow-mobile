import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { colors, radius, shadows, spacing } from '../theme';

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  salary: string;
  tag?: string;
  onPress?: () => void;
}

export function JobCard({
  title,
  company,
  location,
  salary,
  tag,
  onPress,
}: JobCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <LinearGradient
        colors={[colors.surface, colors.surfaceAlt]}
        style={styles.card}
      >
        {tag ? (
          <View style={styles.tag}>
            <AppText variant="caption" color="primary">
              {tag}
            </AppText>
          </View>
        ) : null}
        <AppText variant="h3" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="bodySm" color="textSecondary">
          {company}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="caption" color="textMuted">
            {location}
          </AppText>
          <View style={styles.dot} />
          <AppText variant="caption" color="textMuted">
            {salary}
          </AppText>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { AppText } from '../AppText';

type HotTag = 'HOT' | 'SUPER_HOT' | 'NORMAL' | string | undefined | null;

interface HotTagBadgeProps {
  tag: HotTag;
  compact?: boolean;
}

export function HotTagBadge({ tag, compact = false }: HotTagBadgeProps) {
  if (!tag || tag === 'NORMAL') return null;

  const isSuper = tag === 'SUPER_HOT';
  const colors = isSuper
    ? (['#f43f5e', '#f97316', '#fbbf24'] as const)
    : (['#f97316', '#fbbf24'] as const);

  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.badge, compact && styles.badgeCompact]}
    >
      <Feather name={isSuper ? 'award' : 'zap'} color="#fff" size={compact ? 11 : 12} />
      <AppText variant="caption" style={styles.label}>
        {isSuper ? 'SUPER HOT' : 'HOT'}
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});

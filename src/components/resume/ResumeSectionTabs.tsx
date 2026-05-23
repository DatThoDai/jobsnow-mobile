import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { colors, radius, shadows, spacing } from '../../theme';

export type ResumeSectionTabKey = 'education' | 'experience' | 'projects' | 'certificates';

const TABS: { key: ResumeSectionTabKey; label: string; icon: string }[] = [
  { key: 'education', label: 'Học vấn', icon: 'book' },
  { key: 'experience', label: 'Kinh nghiệm', icon: 'briefcase' },
  { key: 'projects', label: 'Dự án', icon: 'folder' },
  { key: 'certificates', label: 'Chứng chỉ', icon: 'award' },
];

interface ResumeSectionTabsProps {
  active: ResumeSectionTabKey;
  onChange: (key: ResumeSectionTabKey) => void;
}

export function ResumeSectionTabs({ active, onChange }: ResumeSectionTabsProps) {
  return (
    <View style={styles.grid}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.cell, isActive && styles.cellActive]}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Feather
                name={tab.icon as keyof typeof Feather.glyphMap}
                size={20}
                color={isActive ? colors.white : colors.primaryDark}
              />
            </View>
            <AppText
              variant="caption"
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cell: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cellActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryDark,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconWrapActive: {
    backgroundColor: colors.primaryDark,
  },
  label: {
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});

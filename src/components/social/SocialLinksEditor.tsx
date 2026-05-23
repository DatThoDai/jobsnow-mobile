import React from 'react';
import { StyleSheet, View, TextInput, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { colors, radius, spacing, fontFamilies } from '../../theme';

export type SocialLinkRow = {
  platform: string;
  url: string;
  logo_url?: string;
};

const PLATFORMS = ['FACEBOOK', 'LINKEDIN', 'GITHUB', 'TWITTER', 'WEBSITE', 'OTHER'];

interface Props {
  value: SocialLinkRow[];
  onChange: (rows: SocialLinkRow[]) => void;
  disabled?: boolean;
}

export function SocialLinksEditor({ value, onChange, disabled }: Props) {
  const updateRow = (index: number, patch: Partial<SocialLinkRow>) => {
    const next = value.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => {
    onChange([...value, { platform: 'FACEBOOK', url: '', logo_url: '' }]);
  };

  const removeRow = (index: number) => {
    if (value.length <= 1) {
      onChange([{ platform: 'FACEBOOK', url: '', logo_url: '' }]);
      return;
    }
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.wrap}>
      {value.map((row, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.platformRow}>
            {PLATFORMS.map((p) => (
              <Pressable
                key={p}
                disabled={disabled}
                onPress={() => updateRow(index, { platform: p })}
                style={[styles.platformChip, row.platform === p && styles.platformChipActive]}
              >
                <AppText
                  variant="caption"
                  style={row.platform === p ? styles.platformTextActive : styles.platformText}
                >
                  {p.slice(0, 4)}
                </AppText>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            value={row.url}
            onChangeText={(url) => updateRow(index, { url })}
            editable={!disabled}
            autoCapitalize="none"
            keyboardType="url"
          />
          {!disabled && (
            <Pressable onPress={() => removeRow(index)} style={styles.removeBtn}>
              <Feather name="trash-2" size={18} color={colors.danger} />
            </Pressable>
          )}
        </View>
      ))}
      {!disabled && (
        <Pressable onPress={addRow} style={styles.addBtn}>
          <Feather name="plus" size={16} color={colors.primary} />
          <AppText variant="bodySm" color="primary">Thêm liên kết</AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  platformChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  platformText: { color: colors.textMuted, fontSize: 10 },
  platformTextActive: { color: colors.white, fontSize: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamilies.body,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  removeBtn: { alignSelf: 'flex-end', padding: spacing.xs },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});

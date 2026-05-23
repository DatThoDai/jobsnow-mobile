import React from 'react';
import { Pressable, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, radius, shadows, spacing, typography } from '../theme';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  leftIcon?: FeatherIconName;
  compact?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  leftIcon,
  compact,
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        isGhost ? styles.ghost : isOutline ? styles.outline : styles.primary,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.inner}>
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={18}
            color={isOutline || isGhost ? colors.primaryDark : colors.white}
            style={{ marginRight: spacing.sm }}
          />
        ) : null}
        <AppText
          variant="label"
          color={isOutline || isGhost ? 'textPrimary' : 'white'}
          style={[
            styles.text,
            isOutline && styles.outlineText,
            isGhost && styles.ghostText,
            textStyle,
          ]}
        >
          {title}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primaryDark,
    ...shadows.md,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  ghost: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  text: {
    textTransform: 'none',
    ...typography.label,
    fontWeight: '700',
  },
  outlineText: {
    color: colors.primaryDark,
  },
  ghostText: {
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});

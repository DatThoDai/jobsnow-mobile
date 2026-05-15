import React from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { colors, typography } from '../theme';

export type TextVariant = keyof typeof typography;
export type TextColor = keyof typeof colors;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: TextColor;
  style?: StyleProp<TextStyle>;
}

export function AppText({
  variant = 'body',
  color = 'textPrimary',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[styles.base, typography[variant], { color: colors[color] }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});

import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { headerOverlayStyles } from '../theme/headerOverlay';

interface ScreenOverlayHeaderProps {
  onBack: () => void;
  backIconColor?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
  /** Semi-transparent dark circle (hero) vs light surface */
  variant?: 'hero' | 'light';
}

export function ScreenOverlayHeader({
  onBack,
  backIconColor = colors.white,
  right,
  style,
  variant = 'hero',
}: ScreenOverlayHeaderProps) {
  return (
    <View style={[headerOverlayStyles.container, style]} pointerEvents="box-none">
      <View style={headerOverlayStyles.row} pointerEvents="box-none">
        <Pressable
          onPress={onBack}
          style={[
            headerOverlayStyles.button,
            variant === 'light' && headerOverlayStyles.buttonOnLight,
          ]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Feather name="arrow-left" color={backIconColor} size={22} />
        </Pressable>
        {right ? (
          <View style={headerOverlayStyles.right} pointerEvents="box-none">
            {right}
          </View>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}

/** Same touch target as overlay back — use on inline headers. */
export function HeaderOverlayButton({
  onPress,
  children,
  variant = 'hero',
  style,
}: {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'hero' | 'light';
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        headerOverlayStyles.button,
        variant === 'light' && headerOverlayStyles.buttonOnLight,
        style,
      ]}
      hitSlop={12}
    >
      {children}
    </Pressable>
  );
}

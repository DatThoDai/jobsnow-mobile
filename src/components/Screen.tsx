import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  useGradient?: boolean;
}

export function Screen({
  children,
  style,
  contentStyle,
  scroll = false,
  useGradient = true,
}: ScreenProps) {
  const Wrapper = useGradient ? LinearGradient : View;
  const wrapperProps = useGradient
    ? { colors: [colors.background, colors.surface] }
    : {};

  return (
    <Wrapper
      style={[styles.wrapper, !useGradient && styles.plainBackground]}
      {...wrapperProps}
    >
      <SafeAreaView style={[styles.safeArea, style]}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  plainBackground: {
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
});

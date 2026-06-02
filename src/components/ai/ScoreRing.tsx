import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '../AppText';
import { colors } from '../../theme';

export function getScoreColor(score: number) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.primary;
  if (score >= 40) return colors.accent;
  return colors.danger;
}

export function getScoreLabel(score: number) {
  if (score >= 80) return 'Xuất sắc';
  if (score >= 60) return 'Khá';
  if (score >= 40) return 'Trung bình';
  return 'Cần cải thiện';
}

export function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const stroke = getScoreColor(score);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={8}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={stroke}
          strokeWidth={8}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <AppText variant="h1" style={{ fontSize: size * 0.28, fontWeight: '800', color: stroke }}>
          {score}
        </AppText>
        <AppText variant="caption" color="textMuted">/100</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});

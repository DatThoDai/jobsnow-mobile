import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  {
    icon: 'target' as const,
    title: 'Match CV với việc làm',
    description: 'AI gợi ý công việc phù hợp kỹ năng và kinh nghiệm của bạn.',
    route: 'Dashboard' as const,
  },
  {
    icon: 'file-text' as const,
    title: 'Chuẩn hóa CV',
    description: 'Nhận góp ý chi tiết để CV nổi bật hơn với nhà tuyển dụng.',
    route: 'ResumeList' as const,
  },
  {
    icon: 'edit-3' as const,
    title: 'Tạo & quản lý hồ sơ',
    description: 'Xây dựng CV trực tuyến và cập nhật hồ sơ ứng tuyển.',
    route: 'ResumeList' as const,
  },
];

export function HomeAIFeaturesSection() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Feather name="cpu" size={20} color={colors.primary} />
        <AppText variant="h3">Tính năng AI thông minh</AppText>
      </View>
      <AppText variant="bodySm" color="textSecondary" style={styles.subtitle}>
        Khám phá sức mạnh AI trong hành trình tìm việc và phát triển sự nghiệp.
      </AppText>

      {FEATURES.map((feature) => (
        <Pressable
          key={feature.title}
          style={styles.card}
          onPress={() => navigation.navigate(feature.route)}
        >
          <View style={styles.iconWrap}>
            <Feather name={feature.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <AppText variant="body" style={{ fontWeight: '700' }}>{feature.title}</AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
              {feature.description}
            </AppText>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.md, maxWidth: 320 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
});

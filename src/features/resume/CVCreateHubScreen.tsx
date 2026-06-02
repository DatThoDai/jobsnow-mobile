import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { ScreenOverlayHeader } from '../../components/ScreenOverlayHeader';
import { colors, radius, shadows, spacing } from '../../theme';
import { useAuthStore } from '../../stores/useAuthStore';
import { useResumeCreation } from '../../hooks/useResumeCreation';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const OPTIONS = [
  {
    icon: 'zap' as const,
    title: 'Viết CV bằng AI',
    subtitle: 'Nhập vị trí mong muốn — AI tạo nội dung và lưu vào hồ sơ',
    color: colors.accent,
    action: 'ai' as const,
  },
  {
    icon: 'edit-3' as const,
    title: 'Tạo thủ công',
    subtitle: 'Nhập các mục rồi bấm Lưu CV — chưa tạo hồ sơ trên server trước',
    color: colors.primary,
    action: 'manual' as const,
  },
  {
    icon: 'upload' as const,
    title: 'Tải CV lên',
    subtitle: 'PDF hoặc Word — hệ thống phân tích và lưu hồ sơ',
    color: colors.info,
    action: 'upload' as const,
  },
  {
    icon: 'star' as const,
    title: 'Chuẩn hóa CV bằng AI',
    subtitle: 'Phân tích CV hiện có và gợi ý cải thiện',
    color: colors.primaryDark,
    action: 'improve' as const,
  },
];

export function CVCreateHubScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const { createManual, uploadFile, openImprove, openAiGenerate } = useResumeCreation(user?.profileId);

  const onSelect = (action: (typeof OPTIONS)[number]['action']) => {
    switch (action) {
      case 'ai':
        openAiGenerate();
        break;
      case 'manual':
        createManual();
        break;
      case 'upload':
        uploadFile();
        break;
      case 'improve':
        openImprove();
        break;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.hero}>
        <ScreenOverlayHeader onBack={() => navigation.goBack()} />
        <View style={styles.heroText}>
          <AppText variant="h2" color="white" style={{ fontWeight: '800' }}>
            Tạo CV
          </AppText>
          <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs }}>
            Chọn cách tạo hoặc cải thiện hồ sơ xin việc — tất cả trên ứng dụng.
          </AppText>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {OPTIONS.map((opt) => (
          <Pressable key={opt.action} style={styles.card} onPress={() => onSelect(opt.action)}>
            <View style={[styles.iconWrap, { backgroundColor: opt.color + '18' }]}>
              <Feather name={opt.icon} size={24} color={opt.color} />
            </View>
            <View style={styles.cardBody}>
              <AppText variant="body" style={{ fontWeight: '700' }}>
                {opt.title}
              </AppText>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 4, lineHeight: 18 }}>
                {opt.subtitle}
              </AppText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        ))}

        <Pressable style={styles.linkRow} onPress={() => navigation.navigate('ResumeList')}>
          <Feather name="folder" size={18} color={colors.primary} />
          <AppText variant="bodySm" color="primary" style={{ fontWeight: '600' }}>
            Xem danh sách CV đã lưu
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius['3xl'],
    borderBottomRightRadius: radius['3xl'],
  },
  heroText: {
    paddingHorizontal: spacing.lg,
    paddingTop: 88,
    paddingBottom: spacing.md,
  },
  body: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
});

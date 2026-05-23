import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing } from '../../theme';
import {
  subscriptionService,
  SubscriptionPlan,
  CandidateSubscriptionStatus,
} from '../../services/api/subscriptionService';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

WebBrowser.maybeCompleteAuthSession();

export function PricingScreen() {
  const navigation = useNavigation<Nav>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [status, setStatus] = useState<CandidateSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planList, sub] = await Promise.all([
        subscriptionService.getCandidatePlans(),
        subscriptionService.getCandidateSubscriptionStatus(),
      ]);
      setPlans(planList);
      setStatus(sub);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải gói dịch vụ');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handlePurchase = async (planId: number) => {
    try {
      setPurchasing(planId);
      const paymentUrl = await subscriptionService.createPaymentUrl(planId);
      if (!paymentUrl) {
        throw new Error('Không nhận được URL thanh toán');
      }
      await WebBrowser.openBrowserAsync(paymentUrl, {
        dismissButtonStyle: 'close',
        showInRecents: true,
      });
    } catch (e: unknown) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể tạo giao dịch');
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const proPlan = plans[0];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.white} size={22} />
        </Pressable>
        <AppText variant="h2" color="white">Gói dịch vụ</AppText>
        <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          Nâng cấp tài khoản PRO
        </AppText>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {status && status.accountStatus !== 'NO_PLAN' && (
            <View style={styles.statusCard}>
              <Feather name="star" color={colors.accent} size={24} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <AppText variant="bodyMedium" style={{ fontWeight: '700' }}>{status.currentPlanName}</AppText>
                <AppText variant="caption" color="textSecondary">
                  Hết hạn: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString('vi-VN') : '—'}
                </AppText>
              </View>
            </View>
          )}

          <View style={styles.metricsRow}>
            <MetricBox icon="zap" label="AI Matching" value={String(status?.remainingAiMatches ?? 0)} />
            <MetricBox icon="edit-3" label="CV AI" value={String(status?.remainingAiCvBuilderTrials ?? 0)} />
          </View>

          {proPlan ? (
            <View style={styles.planCard}>
              <AppText variant="h2" style={{ textAlign: 'center' }}>{proPlan.name}</AppText>
              <AppText variant="h1" color="primary" style={{ textAlign: 'center', marginVertical: spacing.md }}>
                {formatPrice(proPlan.price)}
              </AppText>
              <AppText variant="bodySm" color="textSecondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
                {proPlan.description || `${proPlan.durationDays} ngày sử dụng`}
              </AppText>
              <PrimaryButton
                title={purchasing === proPlan.planId ? 'Đang xử lý...' : 'Mua gói PRO'}
                onPress={() => handlePurchase(proPlan.planId)}
                disabled={purchasing !== null}
              />
            </View>
          ) : (
            <AppText variant="body" color="textMuted" style={{ textAlign: 'center' }}>
              Chưa có gói dịch vụ khả dụng.
            </AppText>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function MetricBox({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Feather name={icon as any} size={18} color={colors.primary} />
      <AppText variant="caption" color="textSecondary">{label}</AppText>
      <AppText variant="h3">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 50, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  metricsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  metricBox: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
});

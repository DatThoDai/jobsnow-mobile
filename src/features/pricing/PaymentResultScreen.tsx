import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing } from '../../theme';
import { RootStackParamList } from '../../navigation/RootNavigator';

type RouteProps = RouteProp<RootStackParamList, 'PaymentResult'>;

export function PaymentResultScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status, txnRef, flow } = route.params;

  const isSuccess = status === 'success';
  const isFailed = status === 'failed';
  const isCandidate = flow === 'CANDIDATE';

  const message = isSuccess
    ? isCandidate
      ? 'Gói dịch vụ người tìm việc đã được kích hoạt.'
      : 'Thanh toán thành công.'
    : isFailed
      ? 'Giao dịch không thành công. Vui lòng thử lại.'
      : 'Giao dịch không hợp lệ hoặc chữ ký bảo mật không khớp.';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Feather
          name={isSuccess ? 'check-circle' : isFailed ? 'x-circle' : 'alert-triangle'}
          size={64}
          color={isSuccess ? colors.success : isFailed ? colors.danger : colors.accent}
        />
        <AppText variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
          {isSuccess ? 'Thanh toán thành công!' : isFailed ? 'Thanh toán thất bại' : 'Giao dịch không hợp lệ'}
        </AppText>
        <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          {message}
        </AppText>
        {txnRef ? (
          <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.md }}>
            Mã giao dịch: {txnRef}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          {isCandidate && (
            <PrimaryButton title="Quản lý gói dịch vụ" onPress={() => navigation.replace('Pricing')} />
          )}
          {isSuccess && (
            <Pressable onPress={() => navigation.replace('Dashboard')} style={styles.secondaryBtn}>
              <AppText variant="body" color="primary">Về bảng điều khiển</AppText>
            </Pressable>
          )}
          {!isSuccess && (
            <PrimaryButton
              title="Quay lại gói dịch vụ"
              onPress={() => navigation.replace('Pricing')}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: { width: '100%', marginTop: spacing.xl, gap: spacing.md },
  secondaryBtn: { alignItems: 'center', padding: spacing.md },
});

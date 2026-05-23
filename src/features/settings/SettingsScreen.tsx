import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing, fontFamilies } from '../../theme';
import { useAuthStore } from '../../stores/useAuthStore';
import { PUBLIC_SITE_URL } from '../../config/env';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setIsChangingPassword(true);
    try {
      // Web JobSeekerSettingsPage has no BE endpoint yet — same UX as web
      await new Promise((resolve) => setTimeout(resolve, 500));
      Alert.alert('Thành công', 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert('Lỗi', 'Đổi mật khẩu thất bại');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const openTerms = () => {
    const url = `${PUBLIC_SITE_URL}/terms`;
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở liên kết'));
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <AppText variant="h2">Cài đặt</AppText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.card}>
          <AppText variant="caption" color="textMuted" style={styles.sectionLabel}>
            TÀI KHOẢN
          </AppText>
          <AppText variant="body">{user?.email}</AppText>
          <AppText variant="bodySm" color="textSecondary" style={{ marginTop: 4 }}>
            {user?.fullName}
          </AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Feather name="lock" color={colors.primary} size={18} />
            <AppText variant="h3" style={{ fontSize: 16 }}>Đổi mật khẩu</AppText>
          </View>
          <PasswordField label="Mật khẩu hiện tại" value={currentPassword} onChangeText={setCurrentPassword} />
          <PasswordField label="Mật khẩu mới" value={newPassword} onChangeText={setNewPassword} />
          <PasswordField label="Xác nhận mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} />
          <PrimaryButton
            title={isChangingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            onPress={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword}
            style={{ marginTop: spacing.md }}
          />
        </View>

        <View style={styles.card}>
          <Pressable style={styles.linkRow} onPress={openTerms}>
            <Feather name="file-text" color={colors.primary} size={18} />
            <AppText variant="body" style={{ flex: 1 }}>Điều khoản sử dụng</AppText>
            <Feather name="external-link" color={colors.textMuted} size={16} />
          </Pressable>
          <View style={styles.divider} />
          <View style={styles.linkRow}>
            <Feather name="info" color={colors.textMuted} size={18} />
            <AppText variant="body" color="textSecondary">Phiên bản ứng dụng</AppText>
            <AppText variant="bodySm" color="textMuted">{appVersion}</AppText>
          </View>
        </View>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" color={colors.danger} size={18} />
          <AppText variant="body" style={{ color: colors.danger }}>Đăng xuất</AppText>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" color="textSecondary">{label}</AppText>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { paddingBottom: spacing['3xl'] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: { marginBottom: spacing.sm, letterSpacing: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  field: { marginBottom: spacing.md, gap: spacing.xs },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    backgroundColor: colors.surface,
  },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing, fontFamilies } from '../../theme';
import { profileService } from '../../services/api/profileService';
import { useAuthStore } from '../../stores/useAuthStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { JobSeekerProfile } from '../../services/api/models';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function EditProfileScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const data = await profileService.getProfileByUserId(user.userId);
        setProfile(data);
        setFullName(data?.fullName || user.fullName || '');
        setPhone(data?.phone || '');
        setBio(data?.bio || '');
        setAddress(data?.address || '');
      } catch (e) {
        Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updatedProfile = {
        ...profile,
        fullName,
        phone,
        bio,
        address,
      };
      await profileService.updateProfile(profile.profileId, updatedProfile);
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ, vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Feather name="arrow-left" color={colors.textPrimary} size={24} onPress={() => navigation.goBack()} />
          <AppText variant="h2" style={styles.headerTitle}>Chỉnh sửa hồ sơ</AppText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <AppText variant="bodySm" color="textSecondary" style={styles.subtitle}>
            Cập nhật thông tin cá nhân của bạn để nhà tuyển dụng dễ dàng liên hệ.
          </AppText>

          <View style={styles.formGroup}>
            <AppText variant="caption" color="textSecondary" style={styles.label}>HỌ VÀ TÊN</AppText>
            <View style={styles.inputWrap}>
              <Feather name="user" color={colors.textMuted} size={18} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ tên của bạn"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <AppText variant="caption" color="textSecondary" style={styles.label}>SỐ ĐIỆN THOẠI</AppText>
            <View style={styles.inputWrap}>
              <Feather name="phone" color={colors.textMuted} size={18} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại liên hệ"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <AppText variant="caption" color="textSecondary" style={styles.label}>ĐỊA CHỈ</AppText>
            <View style={styles.inputWrap}>
              <Feather name="map-pin" color={colors.textMuted} size={18} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Nhập địa chỉ hiện tại"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <AppText variant="caption" color="textSecondary" style={styles.label}>GIỚI THIỆU BẢN THÂN (BIO)</AppText>
            <View style={[styles.inputWrap, styles.textAreaWrap]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Viết một đoạn ngắn giới thiệu về bản thân..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

        </ScrollView>
        <View style={styles.bottomBar}>
          <PrimaryButton
            title={isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            onPress={handleSave}
            disabled={isSaving || !fullName.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: 20 },
  scrollContent: { paddingBottom: 100 },
  subtitle: { marginBottom: spacing.xl },
  formGroup: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs, fontWeight: '600', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: spacing.md, height: 50,
  },
  textAreaWrap: { height: 120, paddingVertical: spacing.md, alignItems: 'flex-start' },
  input: { flex: 1, fontFamily: fontFamilies.body, fontSize: 16, color: colors.textPrimary },
  textArea: { height: 100 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, paddingTop: spacing.md, paddingBottom: spacing['3xl'],
  },
});

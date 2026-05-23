import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing, fontFamilies } from '../../theme';
import { profileService } from '../../services/api/profileService';
import { skillService, Skill } from '../../services/api/skillService';
import { useAuthStore } from '../../stores/useAuthStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { JobSeekerProfile, ProfileSkill, ProfileSocialLink } from '../../services/api/models';
import { SocialLinksEditor, SocialLinkRow } from '../../components/social/SocialLinksEditor';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function EditProfileScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [headline, setHeadline] = useState('');
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinkRow[]>([
    { platform: 'FACEBOOK', url: '', logo_url: '' },
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const [data, skillList] = await Promise.all([
          profileService.getProfileByUserId(user.userId),
          skillService.getAllSkills(),
        ]);
        setProfile(data);
        setAllSkills(skillList);
        setFullName(data?.fullName || user.fullName || '');
        setPhone(data?.phone || '');
        setBio(data?.bio || '');
        setAddress(data?.address || '');
        setHeadline(data?.title || data?.headline || '');
        setSkills(data?.skills ?? []);
        setSocialLinks(
          data?.socials?.length
            ? data.socials.map((s: ProfileSocialLink) => ({
                platform: s.platform,
                url: s.url,
                logo_url: s.logoUrl ?? '',
              }))
            : [{ platform: 'FACEBOOK', url: '', logo_url: '' }]
        );
      } catch {
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
      const socialsPayload = socialLinks
        .filter((s) => s.url.trim())
        .map((s) => ({
          platform: s.platform,
          url: s.url.trim(),
          logo_url: s.logo_url?.trim() || undefined,
        }));
      await profileService.updateProfile(profile.profileId, {
        fullName,
        phone,
        bio,
        address,
        headline,
        title: headline,
        socials: socialsPayload,
      });
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ, vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async (skill: Skill) => {
    if (!profile || skills.some((s) => s.skillId === skill.skillId)) return;
    setIsAddingSkill(true);
    try {
      await profileService.addProfileSkill(profile.profileId, skills, skill.skillId);
      setSkills((prev) => [...prev, { skillId: skill.skillId, skillName: skill.skillName, level: 'Intermediate' }]);
      setSkillSearch('');
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm kỹ năng.');
    } finally {
      setIsAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId: number) => {
    if (!profile) return;
    try {
      await profileService.removeProfileSkill(profile.profileId, skills, skillId);
      setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    } catch {
      Alert.alert('Lỗi', 'Không thể xóa kỹ năng.');
    }
  };

  const filteredSkills = allSkills.filter(
    (s) =>
      s.skillName.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !skills.some((ps) => ps.skillId === s.skillId)
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" color={colors.textPrimary} size={24} />
          </Pressable>
          <AppText variant="h2" style={styles.headerTitle}>
            Chỉnh sửa hồ sơ
          </AppText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Field label="HỌ VÀ TÊN" icon="user" value={fullName} onChangeText={setFullName} />
          <Field label="CHUYÊN MÔN / HEADLINE" icon="award" value={headline} onChangeText={setHeadline} placeholder="VD: Frontend Developer" />
          <Field label="SỐ ĐIỆN THOẠI" icon="phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="ĐỊA CHỈ" icon="map-pin" value={address} onChangeText={setAddress} />
          <Field label="GIỚI THIỆU (BIO)" value={bio} onChangeText={setBio} multiline />

          <AppText variant="caption" color="textSecondary" style={styles.label}>
            MẠNG XÃ HỘI
          </AppText>
          <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} disabled={isSaving} />

          <AppText variant="caption" color="textSecondary" style={styles.label}>
            KỸ NĂNG
          </AppText>
          <View style={styles.skillsWrap}>
            {skills.length === 0 ? (
              <AppText variant="bodySm" color="textMuted">
                Chưa có kỹ năng nào.
              </AppText>
            ) : (
              skills.map((s) => (
                <View key={s.skillId} style={styles.skillChip}>
                  <AppText variant="caption" color="primary">
                    {s.skillName ?? `Skill #${s.skillId}`}
                  </AppText>
                  <Pressable onPress={() => handleRemoveSkill(s.skillId)} hitSlop={8}>
                    <Feather name="x" color={colors.primary} size={14} />
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View style={styles.inputWrap}>
            <Feather name="search" color={colors.textMuted} size={18} />
            <TextInput
              style={styles.input}
              value={skillSearch}
              onChangeText={setSkillSearch}
              placeholder="Tìm kỹ năng để thêm..."
              placeholderTextColor={colors.textMuted}
            />
          </View>
          {skillSearch.length > 0 && filteredSkills.slice(0, 5).map((s) => (
            <Pressable
              key={s.skillId}
              style={styles.suggestion}
              onPress={() => handleAddSkill(s)}
              disabled={isAddingSkill}
            >
              <AppText variant="bodySm">{s.skillName}</AppText>
              <Feather name="plus" color={colors.primary} size={16} />
            </Pressable>
          ))}
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

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  icon?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.formGroup}>
      <AppText variant="caption" color="textSecondary" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.inputWrap, multiline && styles.textAreaWrap]}>
        {icon ? <Feather name={icon as 'user'} color={colors.textMuted} size={18} /> : null}
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: 20 },
  scrollContent: { paddingBottom: 100 },
  formGroup: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs, fontWeight: '600', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  textAreaWrap: { height: 120, paddingVertical: spacing.md, alignItems: 'flex-start' },
  input: { flex: 1, fontFamily: fontFamilies.body, fontSize: 16, color: colors.textPrimary },
  textArea: { height: 100 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
});

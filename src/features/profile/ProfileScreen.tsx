import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { colors, radius, shadows, spacing } from '../../theme';
import { useAuthStore } from '../../stores/useAuthStore';
import { profileService } from '../../services/api/profileService';
import { notificationService } from '../../services/api/notificationService';
import { JobSeekerProfile } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { resolveMediaUrl } from '../../utils/media';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
          const [profileData, count] = await Promise.all([
            profileService.getProfileByUserId(user.userId),
            notificationService.getUnreadCount(user.userId),
          ]);
          setProfile(profileData);
          setUnreadCount(count || 0);
        } catch (e) {
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }, [user])
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll useGradient={false}>
      <LinearGradient colors={[colors.primarySoft, colors.primary]} style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Avatar
            name={profile?.fullName || user?.fullName || 'U'}
            uri={resolveMediaUrl(profile?.avatar || user?.avatar)}
            size={72}
          />
        </View>
        <AppText variant="h2" color="textPrimary" style={styles.userName}>
          {profile?.fullName || user?.fullName || 'Người dùng'}
        </AppText>
        <AppText variant="bodySm" color="textSecondary">
          {user?.email}
        </AppText>
        {profile?.bio && (
          <AppText variant="caption" color="textSecondary" style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </AppText>
        )}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <AppText variant="h2" color="textPrimary">{profile?.skills?.length || 0}</AppText>
            <AppText variant="caption" color="textSecondary">Kỹ năng</AppText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <AppText variant="h2" color="textPrimary">{unreadCount}</AppText>
            <AppText variant="caption" color="textSecondary">Chưa đọc</AppText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.menuSection}>
        <AppText variant="caption" color="textMuted" style={styles.menuLabel}>TÀI KHOẢN</AppText>
        <MenuItem icon="user" label="Chỉnh sửa hồ sơ" onPress={() => navigation.navigate('EditProfile')} />
        <MenuItem icon="file-text" label="Hồ sơ xin việc" onPress={() => navigation.navigate('ResumeList')} />
        <MenuItem icon="layout" label="Bảng điều khiển" onPress={() => navigation.navigate('Dashboard')} />
        <MenuItem icon="credit-card" label="Gói dịch vụ" onPress={() => navigation.navigate('Pricing')} />
        <MenuItem icon="bell" label="Thông báo" badge={unreadCount > 0 ? unreadCount : undefined} onPress={() => navigation.navigate('Notifications')} />
        {profile?.profileId ? (
          <MenuItem
            icon="eye"
            label="Xem CV công khai"
            subtitle="Hồ sơ chính trên web"
            onPress={() => navigation.navigate('PublicCVPreview', { profileId: profile.profileId })}
          />
        ) : null}
      </View>

      <View style={styles.menuSection}>
        <AppText variant="caption" color="textMuted" style={styles.menuLabel}>KHÁM PHÁ</AppText>
        <MenuItem icon="book-open" label="Cẩm nang nghề nghiệp" onPress={() => navigation.navigate('Handbook')} />
        <MenuItem icon="message-circle" label="Tin nhắn" onPress={() => navigation.navigate('ChatList')} />
        <MenuItem icon="heart" label="Công ty đang theo dõi" onPress={() => navigation.navigate('FollowedCompanies')} />
        <MenuItem icon="settings" label="Cài đặt" onPress={() => navigation.navigate('Settings')} />
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" color={colors.danger} size={18} />
        <AppText variant="body" style={{ color: colors.danger }}>Đăng xuất</AppText>
      </Pressable>
    </Screen>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  badge,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconCircle}>
          <Feather name={icon as any} color={colors.primary} size={18} />
        </View>
        <View>
          <AppText variant="body">{label}</AppText>
          {subtitle ? (
            <AppText variant="caption" color="textMuted">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {badge !== undefined && (
          <View style={styles.badge}>
            <AppText variant="caption" color="white" style={{ fontSize: 11 }}>{badge}</AppText>
          </View>
        )}
        <Feather name="chevron-right" color={colors.textMuted} size={18} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileCard: {
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.xl,
    paddingTop: spacing['3xl'],
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  avatarWrap: { marginBottom: spacing.md },
  userName: { marginBottom: spacing.xs },
  bio: {
    color: 'rgba(255,255,255,0.65)',
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  menuSection: { marginBottom: spacing.xl },
  menuLabel: {
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  menuIconCircle: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger + '30',
    marginBottom: spacing['3xl'],
  },
});

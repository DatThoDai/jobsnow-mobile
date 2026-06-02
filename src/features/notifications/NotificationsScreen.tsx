import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import {colors, radius, shadows, spacing, zIndex } from '../../theme';

import { notificationService } from '../../services/api/notificationService';
import { useAuthStore } from '../../stores/useAuthStore';
import { Notification } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();

  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
          const data = await notificationService.getNotifications(user.userId);
          setNotifications(data || []);
        } catch (e) {
        } finally {
          setIsLoading(false);
        }
      };
      fetch();
    }, [user])
  );

  const handlePress = async (item: Notification) => {
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.notificationId);
        setNotifications((prev) =>
          prev.map((n) => (n.notificationId === item.notificationId ? { ...n, isRead: true } : n))
        );
      } catch {
        // ignore
      }
    }

    if (item.type === 'CHAT' && item.conversationId) {
      navigation.navigate('Chat', {
        conversationId: item.conversationId,
        otherUserName: item.senderName || 'Tin nhắn',
      });
      return;
    }

    if (item.applicationId) {
      navigation.getParent()?.navigate('Main', { screen: 'ApplicationsTab' } as never);
      return;
    }

    if (item.jobTitle) {
      navigation.getParent()?.navigate('Main', { screen: 'SearchTab' } as never);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await notificationService.markAllAsRead(user.userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Feather name="arrow-left" color={colors.white} size={22} />
          </Pressable>
          <AppText variant="h2" color="white">Thông báo</AppText>
          <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Feather name="check-circle" color={colors.white} size={20} />
          </Pressable>
        </View>
        <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Bạn có {unreadCount} thông báo chưa đọc.
        </AppText>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <Feather name="bell-off" color={colors.primary} size={48} />
              </View>
              <AppText variant="h3" color="textPrimary" style={{ marginTop: spacing.md }}>Không có thông báo</AppText>
              <AppText variant="bodySm" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.xl }}>
                Bạn đã xem hết tất cả thông báo hiện có.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, !item.isRead && styles.unreadCard]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.cardIconWrap}>
                <Feather name={item.jobTitle ? "briefcase" : "bell"} color={item.isRead ? colors.textMuted : colors.primary} size={20} />
              </View>
              <View style={styles.cardContent}>
                <AppText variant="bodyMedium" style={{ fontWeight: item.isRead ? '400' : '600' }} numberOfLines={1}>{item.jobTitle || item.content}</AppText>
                {item.jobTitle && <AppText variant="bodySm" color="textSecondary" numberOfLines={2}>{item.content}</AppText>}
                <AppText variant="caption" color="textMuted" style={{ marginTop: spacing.xs }}>{formatTime(item.createdAt)}</AppText>
              </View>
              {!item.isRead && <View style={styles.indicator} />}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    paddingTop: 50, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg,
  },
  headerRow: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  markAllBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing['3xl'] },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.surface,
    borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  unreadCard: { backgroundColor: colors.primarySoft, borderColor: colors.primary + '30' },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardContent: { flex: 1, gap: 2 },
  indicator: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 15, marginLeft: spacing.sm,
  },
});

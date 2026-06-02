import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import {colors, radius, shadows, spacing, zIndex } from '../../theme';

import { chatService } from '../../services/api/chatService';
import { useAuthStore } from '../../stores/useAuthStore';
import { Conversation } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ChatListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
          const data = await chatService.getConversations(user.userId);
          setConversations(data || []);
        } catch (e) {} finally { setIsLoading(false); }
      };
      load();
    }, [user])
  );

  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <AppText variant="h2">Messages</AppText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.center}>
              <Feather name="message-circle" color={colors.textMuted} size={48} />
              <AppText variant="h3" color="textMuted" style={{ marginTop: spacing.md }}>No messages</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[s.card, item.unreadCount > 0 && s.unreadCard]}
              onPress={() => navigation.navigate('Chat', { 
                conversationId: item.conversationId, 
                otherUserName: item.otherUserName,
                otherUserAvatar: item.otherUserAvatar
              })}
            >
              <Avatar name={item.otherUserName} uri={item.otherUserAvatar} size={48} />
              <View style={s.cardContent}>
                <View style={s.cardTop}>
                  <AppText variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>{item.otherUserName}</AppText>
                  <AppText variant="caption" color="textMuted">{formatTime(item.lastMessageAt || '')}</AppText>
                </View>
                <AppText variant="bodySm" color="textMuted" numberOfLines={1}>{item.lastMessage || 'Start a conversation'}</AppText>
              </View>
              {item.unreadCount > 0 && (
                <View style={s.badge}><AppText variant="caption" color="white">{item.unreadCount}</AppText></View>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing['3xl'], paddingBottom: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border,
  },
  headerBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing['3xl'] },
  listContent: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md, ...shadows.sm,
  },
  unreadCard: { backgroundColor: colors.primarySoft, borderColor: colors.primary + '30' },
  cardContent: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  badge: { backgroundColor: colors.danger, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
});

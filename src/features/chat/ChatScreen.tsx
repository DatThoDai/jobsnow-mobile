import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, TextInput, KeyboardAvoidingView, Platform, Image, Alert, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText } from '../../components/AppText';
import { Avatar } from '../../components/Avatar';
import { colors, radius, spacing, fontFamilies, shadows, zIndex } from '../../theme';
import { chatService } from '../../services/api/chatService';
import { useAuthStore } from '../../stores/useAuthStore';
import { ChatMessage } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  CHAT_MESSAGE_PAGE_SIZE,
  mergeChatMessages,
  normalizeChatMessage,
  toInvertedList,
} from '../../utils/chatMessage';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { API_BASE_URL } from '../../config/env';
import { getApiErrorMessage } from '../../utils/apiError';

type RouteProps = RouteProp<RootStackParamList, 'Chat'>;

// Polyfill for SockJS in React Native
if (typeof (global as any).location === 'undefined') {
  (global as any).location = { protocol: 'http' } as any;
}

export function ChatScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState('');
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const stompClientRef = useRef<Client | null>(null);

  const messageTimestamp = (m: ChatMessage) => m.sentAt || m.createdAt;

  const loadInitialMessages = async () => {
    const page = await chatService.getMessagesPage(
      route.params.conversationId,
      undefined,
      CHAT_MESSAGE_PAGE_SIZE,
    );
    const normalized = page.messages.map((m) => normalizeChatMessage(m as Partial<ChatMessage> & Record<string, unknown>));
    setMessages(toInvertedList(normalized));
    setHasMore(page.hasMore);
    setOldestMessageId(page.oldestMessageId);
    setLoadError(null);
  };

  const loadOlderMessages = async () => {
    if (isLoadingOlder || !hasMore || oldestMessageId == null) return;
    setIsLoadingOlder(true);
    try {
      const page = await chatService.getMessagesPage(
        route.params.conversationId,
        oldestMessageId,
        CHAT_MESSAGE_PAGE_SIZE,
      );
      const normalized = page.messages.map((m) => normalizeChatMessage(m as Partial<ChatMessage> & Record<string, unknown>));
      setMessages((prev) => mergeChatMessages(prev, normalized));
      setHasMore(page.hasMore);
      setOldestMessageId(page.oldestMessageId);
    } catch (e) {
      console.warn('loadOlderMessages', e);
    } finally {
      setIsLoadingOlder(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    setOldestMessageId(null);
    setLoadError(null);
    setIsLoading(true);

    const load = async () => {
      try {
        await loadInitialMessages();
      } catch (e) {
        console.warn('loadInitialMessages', e);
        const msg = getApiErrorMessage(e, 'Không thể tải tin nhắn');
        setLoadError(msg);
        Alert.alert('Lỗi', msg);
      } finally {
        setIsLoading(false);
      }
    };
    load();

    // Connect WebSocket
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/conversation/${route.params.conversationId}`, (message) => {
          try {
            const newMessage = normalizeChatMessage(JSON.parse(message.body));
            setMessages((prev) => mergeChatMessages(prev, [newMessage]));
          } catch {
            // ignore malformed payloads
          }
        });
      },
      onStompError: (frame) => {
        console.warn('STOMP error', frame.headers?.message, wsUrl);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [route.params.conversationId]);

  const safeDate = (d?: string) => {
    if (!d) return new Date();
    try {
      const date = new Date(d);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (e) {
      return new Date();
    }
  };

  const formatTime = (d?: string) => {
    const date = safeDate(d);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (d?: string) => {
    const date = safeDate(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Hôm nay';
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSend = () => {
    if (!text.trim() || !stompClientRef.current?.connected) return;
    
    const messageRequest = {
      conversationId: route.params.conversationId,
      senderId: user?.userId || 0,
      content: text,
    };

    stompClientRef.current.publish({
      destination: '/app/message/text',
      body: JSON.stringify(messageRequest),
    });

    setText('');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadFileAndSend(result.assets[0]);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadFileAndSend(result.assets[0]);
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
    });

    if (!result.canceled && result.assets[0]) {
      uploadFileAndSend(result.assets[0]);
    }
  };

  const uploadFileAndSend = async (asset: any) => {
    setIsSending(true);
    try {
      const formData = new FormData();
      const filename = asset.fileName || asset.uri.split('/').pop() || 'upload.jpg';
      const type = asset.type || 'image/jpeg';
      
      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: type,
      } as any);

      const uploaded = await chatService.uploadFile(formData);
      if (uploaded && uploaded.fileUrl) {
        const isImg = uploaded.fileType?.startsWith('image') || type.startsWith('image');
        if (stompClientRef.current?.connected) {
          stompClientRef.current.publish({
            destination: '/app/message/file',
            body: JSON.stringify({
              conversationId: route.params.conversationId,
              senderId: user?.userId || 0,
              filePath: uploaded.fileUrl,
              fileName: uploaded.fileName || filename,
              fileType: uploaded.fileType || type,
              messageType: isImg ? 'IMAGE' : 'FILE',
              content: isImg ? 'Đã gửi một hình ảnh' : 'Đã gửi một tệp đính kèm',
            }),
          });
        }
      }
    } catch (e: any) {
      console.error('Upload failed', e);
      Alert.alert('Lỗi', `Không thể gửi tệp tin: ${e.message || ''}`);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage, index: number }) => {
    const isMe = item.senderId === user?.userId;
    const date = safeDate(messageTimestamp(item));
    const prevDate = index < messages.length - 1 ? safeDate(messageTimestamp(messages[index + 1])) : null;
    const showDateLabel = index === messages.length - 1 || (prevDate && prevDate.toDateString() !== date.toDateString());

    const fileUrl = item.fileUrl || item.attachment?.filePath;

    return (
      <View>
        {showDateLabel && (
          <View style={s.dateLabelWrap}>
            <AppText variant="caption" color="textMuted" style={s.dateLabel}>{formatDateLabel(messageTimestamp(item))}</AppText>
          </View>
        )}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
          {item.messageType === 'IMAGE' && fileUrl ? (
            <Pressable onPress={() => setViewerImage(fileUrl)}>
              <Image source={{ uri: fileUrl }} style={s.messageImage} resizeMode="cover" />
            </Pressable>
          ) : item.messageType === 'FILE' ? (
            <Pressable style={s.fileBubble} onPress={() => Alert.alert('Tải xuống', `Đang tải tệp: ${item.fileName || item.attachment?.fileName}`)}>
              <Feather name="file" size={20} color={isMe ? colors.textPrimary : colors.primary} />
              <AppText variant="bodySm" numberOfLines={1} style={{ flex: 1, color: isMe ? colors.textPrimary : colors.textPrimary }}>
                {item.fileName || item.attachment?.fileName || 'Tệp tin'}
              </AppText>
            </Pressable>
          ) : (
            <AppText variant="bodySm" style={{ color: isMe ? colors.textPrimary : colors.textPrimary }}>{item.content}</AppText>
          )}
          <AppText variant="caption" style={{ color: isMe ? 'rgba(0,0,0,0.5)' : colors.textMuted, marginTop: 4, alignSelf: 'flex-end' }}>{formatTime(messageTimestamp(item))}</AppText>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <Avatar 
          size={40} 
          name={route.params.otherUserName} 
          uri={route.params.otherUserAvatar} 
        />
        <View style={{ flex: 1 }}>
          <AppText variant="h3" numberOfLines={1}>{route.params.otherUserName}</AppText>
          <View style={s.statusRow}>
            <View style={s.onlineDot} />
            <AppText variant="caption" color="textMuted">Đang hoạt động</AppText>
          </View>
        </View>
      </View>

      <Modal visible={!!viewerImage} transparent animationType="fade">
        <View style={s.modalContainer}>
          <TouchableOpacity style={s.modalClose} onPress={() => setViewerImage(null)}>
            <Feather name="x" size={30} color="#fff" />
          </TouchableOpacity>
          {viewerImage && <Image source={{ uri: viewerImage }} style={s.fullImage} resizeMode="contain" />}
        </View>
      </Modal>

      <View style={s.listWrap}>
        {isLoading ? (
          <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : loadError && messages.length === 0 ? (
          <View style={s.center}>
            <AppText variant="bodySm" color="textSecondary" style={{ textAlign: 'center', paddingHorizontal: spacing.xl }}>
              {loadError}
            </AppText>
            <Pressable
              onPress={async () => {
                setIsLoading(true);
                setLoadError(null);
                try {
                  await loadInitialMessages();
                } catch (e) {
                  const msg = getApiErrorMessage(e, 'Không thể tải tin nhắn');
                  setLoadError(msg);
                  Alert.alert('Lỗi', msg);
                } finally {
                  setIsLoading(false);
                }
              }}
              style={{ marginTop: spacing.md }}
            >
              <AppText variant="bodySm" color="primary">Thử lại</AppText>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            style={s.list}
            data={messages}
            keyExtractor={(item, idx) => item.messageId?.toString() || idx.toString()}
            inverted
            maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
            onEndReached={() => void loadOlderMessages()}
            onEndReachedThreshold={0.2}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListFooterComponent={
              isLoadingOlder ? (
                <View style={s.olderLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            renderItem={renderMessage}
          />
        )}
      </View>

      {isSending && (
        <View style={s.sendingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText variant="caption" style={{ marginLeft: 8 }}>Đang gửi...</AppText>
        </View>
      )}

      <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable style={s.attachBtn} onPress={handlePickDocument}>
          <Feather name="paperclip" color={colors.textMuted} size={20} />
        </Pressable>
        <Pressable style={s.attachBtn} onPress={handlePickImage}>
          <Feather name="image" color={colors.textMuted} size={20} />
        </Pressable>
        <Pressable style={s.attachBtn} onPress={handleTakePhoto}>
          <Feather name="camera" color={colors.textMuted} size={20} />
        </Pressable>
        <TextInput
          style={s.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable 
          onPress={handleSend}
          style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
          disabled={!text.trim()}
        >
          <Feather name="send" color={colors.white} size={18} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingTop: spacing['3xl'], paddingBottom: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },
  headerBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  listWrap: { flex: 1 },
  list: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: spacing.sm },
  olderLoader: { paddingVertical: spacing.md, alignItems: 'center' },
  dateLabelWrap: { alignItems: 'center', marginVertical: spacing.lg },
  dateLabel: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.xs },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  messageImage: { width: 240, height: 160, borderRadius: radius.md, marginBottom: 4 },
  fileBubble: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(0,0,0,0.05)', padding: spacing.sm, borderRadius: radius.md },
  sendingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.02)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border,
  },
  attachBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100, borderRadius: radius.xl, backgroundColor: colors.background,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, fontFamily: fontFamilies.body, fontSize: 15, color: colors.textPrimary,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  fullImage: { width: '100%', height: '80%' },
});

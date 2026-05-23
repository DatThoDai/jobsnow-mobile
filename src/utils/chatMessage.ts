import { ChatMessage, ChatMessagesPage } from '../services/api/models';

export const CHAT_MESSAGE_PAGE_SIZE = 10;

export function normalizeChatMessage(raw: Partial<ChatMessage> & Record<string, unknown>): ChatMessage {
  const sentAt = (raw.sentAt as string | undefined) ?? (raw.createdAt as string | undefined) ?? '';
  return {
    ...(raw as ChatMessage),
    sentAt,
    createdAt: sentAt || (raw.createdAt as string | undefined) || '',
  };
}

/** Normalize paginated API payload (object or legacy array). */
export function parseChatMessagesPage(payload: unknown): ChatMessagesPage {
  if (payload == null) {
    return { messages: [], hasMore: false, oldestMessageId: null };
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload && 'code' in payload) {
    return parseChatMessagesPage((payload as { data: unknown }).data);
  }

  if (Array.isArray(payload)) {
    const messages = payload.map((m) =>
      normalizeChatMessage(m as Partial<ChatMessage> & Record<string, unknown>),
    );
    const sorted = [...messages].sort((a, b) => a.messageId - b.messageId);
    return {
      messages: sorted,
      hasMore: false,
      oldestMessageId: sorted[0]?.messageId ?? null,
    };
  }

  const page = payload as ChatMessagesPage;
  const rawMessages = page.messages ?? [];
  const messages = rawMessages.map((m) =>
    normalizeChatMessage(m as Partial<ChatMessage> & Record<string, unknown>),
  );
  return {
    messages,
    hasMore: !!page.hasMore,
    oldestMessageId: page.oldestMessageId ?? messages[0]?.messageId ?? null,
  };
}

/** Merge by messageId; newest first (inverted FlatList). */
export function mergeChatMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<number, ChatMessage>();
  for (const m of [...existing, ...incoming]) {
    if (m?.messageId != null) {
      map.set(m.messageId, normalizeChatMessage(m as Partial<ChatMessage> & Record<string, unknown>));
    }
  }
  return Array.from(map.values()).sort((a, b) => b.messageId - a.messageId);
}

export function toInvertedList(messagesAsc: ChatMessage[]): ChatMessage[] {
  return [...messagesAsc].reverse();
}

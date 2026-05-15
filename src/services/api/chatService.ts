import { apiClient } from './client';
import { BaseResponse, Conversation, ChatMessage } from './models';

export const chatService = {
  getConversations: async (userId: number): Promise<Conversation[]> => {
    const response = await apiClient.get<any, BaseResponse<Conversation[]>>(`/chat/conversations/${userId}`);
    return response.data;
  },

  getMessages: async (conversationId: number): Promise<ChatMessage[]> => {
    const response = await apiClient.get<any, BaseResponse<ChatMessage[]>>(`/chat/messages/${conversationId}`);
    return response.data;
  },

  getUnreadCount: async (userId: number): Promise<number> => {
    const response = await apiClient.get<any, BaseResponse<number>>(`/chat/conversations/unread/${userId}`);
    return response.data;
  },

  createSupportConversation: async (): Promise<any> => {
    const response = await apiClient.post<any, BaseResponse<any>>('/chat/support/conversation');
    return response.data;
  },

  sendMessage: async (conversationId: number, senderId: number, content: string): Promise<ChatMessage> => {
    const response = await apiClient.post<any, BaseResponse<ChatMessage>>('/chat/message/text', {
      conversationId,
      senderId,
      content,
    });
    return response.data;
  },

  uploadFile: async (formData: FormData): Promise<{ fileUrl: string; fileName: string; fileType: string }> => {
    const response = await apiClient.post<any, BaseResponse<any>>('/chat/upload', formData);
    return response.data;
  },

  sendFileMessage: async (conversationId: number, senderId: number, fileUrl: string, fileName: string, fileType: string): Promise<ChatMessage> => {
    const response = await apiClient.post<any, BaseResponse<ChatMessage>>('/chat/message/file', {
      conversationId,
      senderId,
      fileUrl,
      fileName,
      fileType,
    });
    return response.data;
  },

  deleteConversation: async (conversationId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/chat/conversation/${conversationId}?userId=${userId}`);
  },
};

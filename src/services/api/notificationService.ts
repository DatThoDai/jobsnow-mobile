import { apiClient } from './client';
import { BaseResponse, Notification } from './models';

export const notificationService = {
  getNotifications: async (userId: number): Promise<Notification[]> => {
    const response = await apiClient.get<any, BaseResponse<Notification[]>>(`/notification/user/${userId}`);
    return response.data;
  },

  getUnreadCount: async (userId: number): Promise<number> => {
    const response = await apiClient.get<any, BaseResponse<number>>(`/notification/user/${userId}/unread-count`);
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await apiClient.put(`/notification/${notificationId}/read`);
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    await apiClient.put(`/notification/user/${userId}/read-all`);
  },
};

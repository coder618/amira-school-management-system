import { apiClient } from '../../../shared/services/apiClient';
import {
  NotificationItem,
  NotificationListResponse,
  NotificationFilter,
  NotificationPayload,
} from '../types';

export const notificationApi = {
  getNotifications: async (
    filter: NotificationFilter = 'all',
    search?: string,
    type?: string
  ): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications', {
      params: {
        filter,
        search: search?.trim() || undefined,
        type: type || undefined,
      },
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unread_count: number }>('/notifications/unread-count');
    return res.data.unread_count;
  },

  createNotification: async (payload: NotificationPayload): Promise<NotificationItem> => {
    const res = await apiClient.post<NotificationItem>('/notifications', payload);
    return res.data;
  },

  markAsRead: async (id: number): Promise<{ message: string; notification: NotificationItem }> => {
    const res = await apiClient.patch<{ message: string; notification: NotificationItem }>(
      `/notifications/${id}/read`
    );
    return res.data;
  },

  markAsUnread: async (id: number): Promise<{ message: string; notification: NotificationItem }> => {
    const res = await apiClient.patch<{ message: string; notification: NotificationItem }>(
      `/notifications/${id}/unread`
    );
    return res.data;
  },

  markAllAsRead: async (): Promise<{ message: string; unread_count: number }> => {
    const res = await apiClient.post<{ message: string; unread_count: number }>(
      '/notifications/mark-all-read'
    );
    return res.data;
  },

  deleteNotification: async (id: number): Promise<{ message: string; notification_id: number }> => {
    const res = await apiClient.delete<{ message: string; notification_id: number }>(
      `/notifications/${id}`
    );
    return res.data;
  },

  restoreNotification: async (id: number): Promise<{ message: string; notification: NotificationItem }> => {
    const res = await apiClient.post<{ message: string; notification: NotificationItem }>(
      `/notifications/${id}/restore`
    );
    return res.data;
  },

  forceDeleteNotification: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/notifications/${id}/force`);
    return res.data;
  },

  emptyTrash: async (): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>('/notifications/trash/empty');
    return res.data;
  },
};

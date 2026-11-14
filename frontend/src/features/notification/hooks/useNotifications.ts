import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../api';
import {
  NotificationItem,
  NotificationFilter,
  NotificationPayload,
} from '../types';

export const useNotifications = (initialFilter: NotificationFilter = 'all') => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [archivedCount, setArchivedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationApi.getNotifications(filter, search, typeFilter);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count ?? 0);
      setArchivedCount(data.archived_count ?? 0);
    } catch (err: unknown) {
      console.error('Failed to load notifications:', err);
      setError('Could not retrieve notifications.');
    } finally {
      setLoading(false);
    }
  }, [filter, search, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationApi.markAsRead(id);
    } catch {
      await fetchNotifications();
    }
  };

  const markAsUnread = async (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: null } : n))
    );
    setUnreadCount((prev) => prev + 1);

    try {
      await notificationApi.markAsUnread(id);
    } catch {
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
    } catch {
      await fetchNotifications();
    }
  };

  const deleteNotification = async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    // Optimistic removal from active view
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read_at) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setArchivedCount((prev) => prev + 1);

    try {
      await notificationApi.deleteNotification(id);
    } catch {
      await fetchNotifications();
    }
  };

  const restoreNotification = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setArchivedCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationApi.restoreNotification(id);
      await fetchNotifications();
    } catch {
      await fetchNotifications();
    }
  };

  const forceDeleteNotification = async (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setArchivedCount((prev) => Math.max(0, prev - 1));

    try {
      await notificationApi.forceDeleteNotification(id);
    } catch {
      await fetchNotifications();
    }
  };

  const emptyTrash = async () => {
    setNotifications([]);
    setArchivedCount(0);

    try {
      await notificationApi.emptyTrash();
    } catch {
      await fetchNotifications();
    }
  };

  const sendNotification = async (payload: NotificationPayload) => {
    const created = await notificationApi.createNotification(payload);
    await fetchNotifications();
    return created;
  };

  return {
    notifications,
    unreadCount,
    archivedCount,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    restoreNotification,
    forceDeleteNotification,
    emptyTrash,
    sendNotification,
  };
};

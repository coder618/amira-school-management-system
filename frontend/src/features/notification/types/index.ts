export type NotificationType = 'info' | 'success' | 'warning' | 'urgent' | 'attendance' | 'exam' | 'finance';

export interface NotificationItem {
  id: number;
  user_id: number;
  school_id?: number | null;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown> | null;
  read_at: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
  archived_count: number;
  total_count: number;
}

export type NotificationFilter = 'all' | 'unread' | 'read' | 'archived';

export interface NotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
  user_id?: number;
  school_id?: number;
  data?: Record<string, unknown>;
}

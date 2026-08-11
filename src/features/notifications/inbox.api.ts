import apiClient from '../../shared/api/client';

/**
 * In-app notification inbox client.
 *
 * Matches the real Django backend (notifications/inbox_api.py). Every inbox
 * endpoint requires a `portal` param; the mobile app is the customer portal.
 *
 * Endpoints (relative to /api/shop):
 *  - GET  /notifications/inbox/                 -> InboxResponse
 *  - GET  /notifications/inbox/unread-count/    -> UnreadCountResponse
 *  - POST /notifications/inbox/{id}/read/       -> MarkReadResponse
 *  - POST /notifications/inbox/read-all/        -> MarkAllReadResponse
 */

export type NotificationPortal = 'customer' | 'crm' | 'admin' | 'dietician';

/** The mobile client always speaks to the customer portal. */
export const NOTIFICATION_PORTAL: NotificationPortal = 'customer';

export interface InAppNotification {
  id: number;
  audience: string;
  category: string;
  event_type: string;
  title: string;
  body: string;
  link_path: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/** Custom envelope returned by inbox_list (NOT DRF pagination). */
export interface InboxResponse {
  success: boolean;
  portal: string;
  unread_count: number;
  notifications: InAppNotification[];
}

export interface UnreadCountResponse {
  success: boolean;
  portal: string;
  unread_count: number;
}

export interface MarkReadResponse {
  success: boolean;
  notification: InAppNotification;
}

export interface MarkAllReadResponse {
  success: boolean;
  marked_read: number;
}

export const inboxApi = {
  async list(params?: { unread?: boolean; limit?: number }): Promise<InboxResponse> {
    const query: Record<string, string | number> = { portal: NOTIFICATION_PORTAL };
    if (params?.unread) query.unread = '1';
    if (params?.limit != null) query.limit = params.limit;
    const { data } = await apiClient.get<InboxResponse>('/notifications/inbox/', {
      params: query,
    });
    return data;
  },

  async unreadCount(): Promise<UnreadCountResponse> {
    const { data } = await apiClient.get<UnreadCountResponse>(
      '/notifications/inbox/unread-count/',
      { params: { portal: NOTIFICATION_PORTAL } }
    );
    return data;
  },

  async markRead(id: number): Promise<MarkReadResponse> {
    const { data } = await apiClient.post<MarkReadResponse>(
      `/notifications/inbox/${id}/read/`,
      { portal: NOTIFICATION_PORTAL }
    );
    return data;
  },

  async markAllRead(): Promise<MarkAllReadResponse> {
    const { data } = await apiClient.post<MarkAllReadResponse>(
      '/notifications/inbox/read-all/',
      { portal: NOTIFICATION_PORTAL }
    );
    return data;
  },
};

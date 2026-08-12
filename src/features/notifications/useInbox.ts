import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboxApi, type InboxResponse } from './inbox.api';

export const INBOX_QUERY_KEY = ['notifications', 'inbox'] as const;
export const INBOX_UNREAD_QUERY_KEY = ['notifications', 'inbox', 'unread-count'] as const;

/** Full inbox list (customer portal). */
export const useInbox = (enabled = true) =>
  useQuery({
    queryKey: INBOX_QUERY_KEY,
    queryFn: () => inboxApi.list({ limit: 50 }),
    staleTime: 30 * 1000,
    enabled,
  });

/** Lightweight unread badge count (customer portal). */
export const useUnreadCount = (enabled = true) =>
  useQuery({
    queryKey: INBOX_UNREAD_QUERY_KEY,
    queryFn: () => inboxApi.unreadCount(),
    staleTime: 30 * 1000,
    enabled,
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: INBOX_QUERY_KEY });
  qc.invalidateQueries({ queryKey: INBOX_UNREAD_QUERY_KEY });
};

/** Mark a single notification read, optimistically. */
export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => inboxApi.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: INBOX_QUERY_KEY });
      const previous = qc.getQueryData<InboxResponse>(INBOX_QUERY_KEY);
      if (previous) {
        const now = new Date().toISOString();
        const notifications = previous.notifications.map((n) =>
          n.id === id && !n.is_read ? { ...n, is_read: true, read_at: now } : n
        );
        const unread_count = notifications.filter((n) => !n.is_read).length;
        qc.setQueryData<InboxResponse>(INBOX_QUERY_KEY, {
          ...previous,
          notifications,
          unread_count,
        });
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(INBOX_QUERY_KEY, ctx.previous);
    },
    onSettled: () => invalidate(qc),
  });
};

/** Mark every notification read, optimistically. */
export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inboxApi.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: INBOX_QUERY_KEY });
      const previous = qc.getQueryData<InboxResponse>(INBOX_QUERY_KEY);
      if (previous) {
        const now = new Date().toISOString();
        const notifications = previous.notifications.map((n) =>
          n.is_read ? n : { ...n, is_read: true, read_at: now }
        );
        qc.setQueryData<InboxResponse>(INBOX_QUERY_KEY, {
          ...previous,
          notifications,
          unread_count: 0,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(INBOX_QUERY_KEY, ctx.previous);
    },
    onSettled: () => invalidate(qc),
  });
};

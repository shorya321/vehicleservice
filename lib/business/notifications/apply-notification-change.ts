/**
 * Applies a synced change to the business bell's list and unread count straight
 * away, so the bell does not wait for its refetch. Server actions run one at a
 * time, so the refetch queues behind the page's own calls. The caller still
 * refetches afterwards; this is only the instant first step.
 *
 * Unread means `is_read === false`, the same test the server's count uses.
 * Business module copy on purpose (see notification-sync.ts beside it).
 */
import type { BusinessNotificationChange } from '@/lib/business/notifications/notification-sync';

interface SyncableRow {
  id: string;
  is_read: boolean | null;
  category: string;
}

export interface BusinessBellState<T extends SyncableRow> {
  notifications: T[];
  unreadCount: number;
}

export function applyBusinessNotificationChange<T extends SyncableRow>(
  state: BusinessBellState<T>,
  change: BusinessNotificationChange
): BusinessBellState<T> {
  const { notifications, unreadCount } = state;
  const isUnread = (n: T): boolean => n.is_read === false;
  const lower = (by: number): number => Math.max(0, unreadCount - by);

  switch (change.type) {
    case 'read': {
      const hit = notifications.find((n) => n.id === change.id);
      if (!hit) return state;
      return {
        notifications: notifications.map((n) => (n.id === change.id ? { ...n, is_read: true } : n)),
        unreadCount: isUnread(hit) ? lower(1) : unreadCount,
      };
    }
    case 'deleted': {
      const hit = notifications.find((n) => n.id === change.id);
      if (!hit) return state;
      return {
        notifications: notifications.filter((n) => n.id !== change.id),
        unreadCount: isUnread(hit) ? lower(1) : unreadCount,
      };
    }
    case 'read-all': {
      const inScope = (n: T): boolean => !change.category || n.category === change.category;
      return {
        notifications: notifications.map((n) => (inScope(n) ? { ...n, is_read: true } : n)),
        // Without a category every row is read. With one, only the visible rows of it
        // are known here; the refetch fills in the rest.
        unreadCount: change.category
          ? lower(notifications.filter((n) => inScope(n) && isUnread(n)).length)
          : 0,
      };
    }
    case 'cleared-read':
      return {
        notifications: notifications.filter(
          (n) => !n.is_read || (change.category !== undefined && n.category !== change.category)
        ),
        unreadCount,
      };
  }
}

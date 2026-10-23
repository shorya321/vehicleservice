import { bookingDayKey, bookingRelativeTime } from '@/lib/utils/timezone';
import type { Notification, NotificationCategory } from './types';

/**
 * Pure helpers behind the header notification panel shared by the admin and
 * vendor portals. Kept out of the component so the grouping, filtering and
 * labels can be tested without rendering Radix.
 */

export type NotificationTab = 'all' | 'unread';

/** Colour family of a category's icon tile; maps to `.notif-tone--*` in app/admin/globals.css. */
export type NotificationTone = 'gold' | 'sky' | 'violet' | 'amber' | 'emerald' | 'zinc';

export interface CategoryMeta {
  label: string;
  tone: NotificationTone;
}

export const CATEGORY_META: Record<NotificationCategory, CategoryMeta> = {
  booking: { label: 'Booking', tone: 'gold' },
  user: { label: 'User', tone: 'sky' },
  vendor_application: { label: 'Vendor application', tone: 'violet' },
  review: { label: 'Review', tone: 'amber' },
  payment: { label: 'Payment', tone: 'emerald' },
  system: { label: 'System', tone: 'zinc' },
};

export function categoryMeta(category: string | null | undefined): CategoryMeta {
  return CATEGORY_META[category as NotificationCategory] ?? CATEGORY_META.system;
}

/**
 * Rows the panel shows at once. Five fit on a laptop screen without an inner
 * scrollbar; the rest are one click away on the full page.
 */
export const PANEL_ROWS = 5;

/** The tab's rows, capped at PANEL_ROWS. */
export function filterNotifications(list: Notification[], tab: NotificationTab): Notification[] {
  const rows = tab === 'unread' ? list.filter((n) => !n.is_read) : list;
  return rows.slice(0, PANEL_ROWS);
}

export interface NotificationGroups {
  today: Notification[];
  earlier: Notification[];
}

/**
 * Splits on the operating-timezone day, so every viewer sees the same "Today".
 * A row with no `created_at` cannot be placed and goes to Earlier.
 */
export function groupNotifications(list: Notification[], today: string): NotificationGroups {
  const isToday = (n: Notification): boolean =>
    Boolean(n.created_at) && bookingDayKey(n.created_at as string) === today;
  return {
    today: list.filter(isToday),
    earlier: list.filter((n) => !isToday(n)),
  };
}

/**
 * Computed from `created_at` at render time. The server's `timeAgo` is frozen at
 * fetch time, and a row pushed over realtime arrives without one at all.
 */
export function notificationTime(n: Notification, now: Date = new Date()): string {
  if (n.created_at) return bookingRelativeTime(n.created_at, now);
  return n.timeAgo ?? '';
}

/** Badge text on the bell. Two digits is all the 18px pill holds. */
export function badgeLabel(unreadCount: number): string {
  return unreadCount > 9 ? '9+' : String(unreadCount);
}

/** Copy for the empty list, which differs by tab and by whether unread rows exist beyond the loaded page. */
export function emptyCopy(
  tab: NotificationTab,
  unreadCount: number,
  idleMessage: string
): { title: string; body: string } {
  if (tab === 'unread') {
    return unreadCount > 0
      ? { title: 'Older unread notifications', body: 'They are not in this list. Open all notifications to see them.' }
      : { title: 'No unread notifications', body: 'Everything here has been read. Switch to All to see past alerts.' };
  }
  return { title: 'You are all caught up', body: idleMessage };
}

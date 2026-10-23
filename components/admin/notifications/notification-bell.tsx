'use client';

import { useAdminNotifications } from '@/lib/hooks/use-admin-notifications';
import { NotificationPanel } from './notification-panel';

/** Rows fetched for the panel. Enough to fill Today and Earlier and the Unread tab. */
const PANEL_LIMIT = 10;

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useAdminNotifications(PANEL_LIMIT);

  return (
    <NotificationPanel
      notifications={notifications}
      unreadCount={unreadCount}
      loading={loading}
      markAsRead={markAsRead}
      markAllAsRead={() => markAllAsRead()}
      deleteNotification={deleteNotification}
      viewAllHref="/admin/notifications"
      idleMessage="New bookings, vendor applications and payments will show up here."
    />
  );
}

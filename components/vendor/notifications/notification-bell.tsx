'use client';

import { useVendorNotifications } from '@/lib/hooks/use-vendor-notifications';
import { NotificationPanel } from '@/components/admin/notifications/notification-panel';

/** Rows fetched for the panel. Enough to fill Today and Earlier and the Unread tab. */
const PANEL_LIMIT = 10;

export function VendorNotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useVendorNotifications(PANEL_LIMIT);

  return (
    <NotificationPanel
      notifications={notifications}
      unreadCount={unreadCount}
      loading={loading}
      markAsRead={markAsRead}
      markAllAsRead={() => markAllAsRead()}
      deleteNotification={deleteNotification}
      viewAllHref="/vendor/notifications"
      idleMessage="New trips, payouts and reviews will show up here."
    />
  );
}

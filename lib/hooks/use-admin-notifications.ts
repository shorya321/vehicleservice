'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subscribeWithAuth } from '@/lib/supabase/subscribe-with-auth';
import { Notification, NotificationCategory } from '@/lib/notifications/types';
import {
  getRecentNotificationsAction,
  getUnreadCountAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '@/app/admin/(shell)/notifications/actions';
import { toast } from 'sonner';
import {
  createNotificationSyncSource,
  publishNotificationChange,
  subscribeNotificationChanges,
} from '@/lib/notifications/notification-sync';
import { applyNotificationChange } from '@/lib/notifications/apply-notification-change';

interface UseAdminNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (category?: NotificationCategory) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAdminNotifications(limit: number = 5): UseAdminNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  // Identifies this bell, so it ignores its own sync announcements.
  const [syncSource] = useState(createNotificationSyncSource);

  const hasLoaded = useRef(false);

  // Fetch initial notifications and unread count
  const fetchNotifications = useCallback(async () => {
    try {
      // Only show loading spinner on initial fetch, not refetches
      if (!hasLoaded.current) {
        setLoading(true);
      }
      const [notificationsResult, countResult] = await Promise.all([
        getRecentNotificationsAction(limit),
        getUnreadCountAction(),
      ]);

      if (notificationsResult.data) {
        setNotifications(notificationsResult.data.notifications);
      } else if ('error' in notificationsResult && notificationsResult.error) {
        console.error('Notifications fetch error:', notificationsResult.error);
      }

      if (countResult.data !== undefined) {
        setUnreadCount(countResult.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      hasLoaded.current = true;
      setLoading(false);
    }
  }, [limit]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      publishNotificationChange('admin', syncSource, { type: 'read', id: notificationId });
    }
  }, [syncSource]);

  // Mark all as read
  const markAllAsRead = useCallback(async (category?: NotificationCategory) => {
    const result = await markAllAsReadAction(category);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      publishNotificationChange('admin', syncSource, { type: 'read-all', category });
    } else {
      toast.error('Failed to mark notifications as read');
    }
  }, [syncSource]);

  // Delete a notification.
  //
  // The realtime channel below subscribes to INSERT only, and Supabase sends nothing
  // but the primary key on DELETE unless the table is set to REPLICA IDENTITY FULL,
  // so a delete never arrives over it. Refetching afterwards is what pulls the next
  // notification into this capped list of `limit`.
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      let wasUnread = false;

      setNotifications((prev) => {
        wasUnread = prev.some((n) => n.id === notificationId && !n.is_read);
        return prev.filter((n) => n.id !== notificationId);
      });

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      const result = await deleteNotificationAction(notificationId);

      if (result.error) {
        toast.error('Failed to delete notification');
      } else {
        publishNotificationChange('admin', syncSource, { type: 'deleted', id: notificationId });
      }

      await fetchNotifications();
    },
    [fetchNotifications, syncSource]
  );

  // Get current user and set up realtime subscription
  // onAuthStateChange fires immediately with the current session on subscribe,
  // so we don't need a separate getUser() call (which caused double-fetch race conditions)
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchNotifications();
      } else {
        setUserId(null);
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [fetchNotifications]);

  // Set up Supabase Realtime subscription for new notifications
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Subscribe to INSERT events on notifications table for this user
    // Join only once the user's token is on the socket, or RLS hides every row
    // and no INSERT ever arrives (see subscribeWithAuth).
    // The topic is per instance: two hooks sharing one topic share one channel,
    // and the second listener makes the join reply fail with a postgres
    // binding mismatch, which unsubscribes the channel for both.
    return subscribeWithAuth(supabase, () =>
      supabase
        .channel(`notifications:${userId}:${syncSource}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;

            // Add to notifications list
            setNotifications((prev) => [newNotification, ...prev.slice(0, limit - 1)]);

            // Increment unread count
            setUnreadCount((prev) => prev + 1);

            // Show toast notification
            toast.info(newNotification.title, {
              // Stable id: the header bell and the sidebar badge both run this hook,
              // and the toast library shows one toast per id.
              id: `notification-${newNotification.id}`,
              description: newNotification.message,
              action: newNotification.link
                ? {
                    label: 'View',
                    onClick: () => {
                      window.location.href = newNotification.link!;
                    },
                  }
                : undefined,
            });
          }
        )
        .subscribe()
    );
  }, [userId, limit, syncSource]);

  // Latest list and count, read by the sync listener below without re-subscribing.
  const bellStateRef = useRef({ notifications, unreadCount });
  useEffect(() => {
    bellStateRef.current = { notifications, unreadCount };
  }, [notifications, unreadCount]);

  // Catch up when the notifications page, or another tab, reads or deletes.
  // The realtime channel only carries INSERTs, so without this the count went
  // stale until a reload. Apply the change at once, then refetch to confirm.
  useEffect(() => {
    if (!userId) return;
    return subscribeNotificationChanges(
      'admin',
      ({ change }) => {
        const next = applyNotificationChange(bellStateRef.current, change);
        setNotifications(next.notifications);
        setUnreadCount(next.unreadCount);
        void fetchNotifications();
      },
      { ignoreSource: syncSource }
    );
  }, [userId, fetchNotifications, syncSource]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}

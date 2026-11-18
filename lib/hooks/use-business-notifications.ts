'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Notification, NotificationCategory } from '@/lib/notifications/types';
import {
  getRecentNotificationsAction,
  getUnreadCountAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '@/app/business/(portal)/notifications/actions';
import { toast } from 'sonner';
import {
  createBusinessNotificationSyncSource,
  publishBusinessNotificationChange,
  subscribeBusinessNotificationChanges,
} from '@/lib/business/notifications/notification-sync';
import { applyBusinessNotificationChange } from '@/lib/business/notifications/apply-notification-change';

interface UseBusinessNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (category?: NotificationCategory) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useBusinessNotifications(limit: number = 5): UseBusinessNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  // Only the first fetch shows the loading state. Sync refetches would otherwise
  // swap an open bell panel's list for a skeleton.
  const hasLoadedRef = useRef(false);
  // Identifies this bell, so it ignores its own sync announcements.
  const [syncSource] = useState(createBusinessNotificationSyncSource);

  // Fetch initial notifications and unread count
  const fetchNotifications = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const [notificationsResult, countResult] = await Promise.all([
        getRecentNotificationsAction(limit),
        getUnreadCountAction(),
      ]);

      if (notificationsResult.data) {
        setNotifications(notificationsResult.data.notifications);
      }

      if (countResult.data !== undefined) {
        setUnreadCount(countResult.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      hasLoadedRef.current = true;
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
      publishBusinessNotificationChange(syncSource, { type: 'read', id: notificationId });
    }
  }, [syncSource]);

  // Mark all as read
  const markAllAsRead = useCallback(async (category?: NotificationCategory) => {
    const result = await markAllAsReadAction(category);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      publishBusinessNotificationChange(syncSource, { type: 'read-all', category });
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
        publishBusinessNotificationChange(syncSource, { type: 'deleted', id: notificationId });
      }

      await fetchNotifications();
    },
    [fetchNotifications, syncSource]
  );

  // Get current user and set up realtime subscription
  useEffect(() => {
    const supabase = createClient();

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        if (!hasFetchedRef.current) {
          hasFetchedRef.current = true;
          fetchNotifications();
        }
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        // Only fetch if this is not the initial session (already handled by getUser)
        if (!hasFetchedRef.current) {
          hasFetchedRef.current = true;
          fetchNotifications();
        }
      } else {
        setUserId(null);
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        hasFetchedRef.current = false;
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
    const channel = supabase
      .channel(`business_notifications:${userId}`)
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

          // Only show business-relevant notifications
          if (['booking', 'payment', 'system'].includes(newNotification.category)) {
            // Add to notifications list
            setNotifications((prev) => [newNotification, ...prev.slice(0, limit - 1)]);

            // Increment unread count
            setUnreadCount((prev) => prev + 1);

            // Show toast notification
            toast.info(newNotification.title, {
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
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [userId, limit]);

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
    return subscribeBusinessNotificationChanges(
      ({ change }) => {
        const next = applyBusinessNotificationChange(bellStateRef.current, change);
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Notification, NotificationCategory } from '@/lib/notifications/types';
import {
  getRecentNotificationsAction,
  getUnreadCountAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '@/app/vendor/notifications/actions';
import { toast } from 'sonner';

interface UseVendorNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (category?: NotificationCategory) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendorNotifications(limit: number = 5): UseVendorNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch initial notifications and unread count
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
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
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async (category?: NotificationCategory) => {
    const result = await markAllAsReadAction(category);
    if (result.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    }
  }, []);

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
      }

      await fetchNotifications();
    },
    [fetchNotifications]
  );

  // Get current user and set up realtime subscription
  useEffect(() => {
    const supabase = createClient();

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchNotifications();
      }
    });

    // Subscribe to auth changes
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
      .channel(`vendor_notifications:${userId}`)
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
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [userId, limit]);

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

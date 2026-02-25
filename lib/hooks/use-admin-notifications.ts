'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Notification, NotificationCategory } from '@/lib/notifications/types';
import {
  getRecentNotificationsAction,
  getUnreadCountAction,
  markNotificationAsReadAction,
  markAllAsReadAction,
} from '@/app/admin/notifications/actions';
import { toast } from 'sonner';

interface UseAdminNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (category?: NotificationCategory) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAdminNotifications(limit: number = 5): UseAdminNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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
    const channel = supabase
      .channel(`notifications:${userId}`)
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
    refetch: fetchNotifications,
  };
}

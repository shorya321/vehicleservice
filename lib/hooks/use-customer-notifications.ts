'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Notification } from '@/lib/notifications/types';
import { toast } from 'sonner';

interface UseCustomerNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useCustomerNotifications(limit: number = 5): UseCustomerNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, [supabase]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .in('category', ['booking', 'payment', 'system'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (notificationsError) throw notificationsError;

      setNotifications(notificationsData || []);

      // Fetch unread count
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('category', ['booking', 'payment', 'system'])
        .eq('is_read', false);

      if (countError) throw countError;

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, limit]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`customer_notifications:${userId}`)
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

          // Only show customer-relevant notifications
          if (['booking', 'payment', 'system'].includes(newNotification.category)) {
            // Add to notifications list
            setNotifications((prev) => [newNotification, ...prev.slice(0, limit - 1)]);
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, limit, supabase]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refreshNotifications: fetchNotifications,
  };
}

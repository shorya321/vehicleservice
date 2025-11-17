import { createClient } from '@/lib/supabase/server';
import { NotificationCategory, NotificationFilters, NotificationsResponse } from './types';
import { formatDistanceToNow } from 'date-fns';

export class NotificationService {
  /**
   * Get notifications for a user with optional filters
   */
  static async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<NotificationsResponse> {
    const supabase = await createClient();
    const { category, is_read, limit = 50, offset = 0 } = filters;

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (is_read !== undefined) {
      query = query.eq('is_read', is_read);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }

    // Add time ago to each notification
    const notifications = (data || []).map((notification) => ({
      ...notification,
      timeAgo: notification.created_at
        ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
        : undefined,
    }));

    // Get unread count
    const unreadCount = await this.getUnreadCount(userId, category);

    return {
      notifications,
      unreadCount,
      total: count || 0,
    };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(
    userId: string,
    category?: NotificationCategory
  ): Promise<number> {
    const supabase = await createClient();

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (category) {
      query = query.eq('category', category);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc('mark_notification_read', {
      p_notification_id: notificationId,
    });

    if (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(
    userId: string,
    category?: NotificationCategory
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc('mark_all_notifications_read', {
      p_user_id: userId,
      p_category: category || null,
    });

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Get recent notifications (for dropdown)
   */
  static async getRecentNotifications(userId: string, limit: number = 5) {
    return this.getNotifications(userId, { limit });
  }
}

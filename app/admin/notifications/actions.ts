'use server';

import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/lib/notifications/notification-service';
import { NotificationCategory } from '@/lib/notifications/types';
import { createClient } from '@/lib/supabase/server';

/**
 * Get notifications for the current user
 */
export async function getNotificationsAction(
  category?: NotificationCategory,
  page: number = 1,
  limit: number = 20
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const offset = (page - 1) * limit;
    const result = await NotificationService.getNotifications(user.id, {
      category,
      limit,
      offset,
    });

    return { data: result };
  } catch (error) {
    console.error('Error in getNotificationsAction:', error);
    return { error: 'Failed to fetch notifications' };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCountAction(category?: NotificationCategory) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: 0 };
    }

    const count = await NotificationService.getUnreadCount(user.id, category);
    return { data: count };
  } catch (error) {
    console.error('Error in getUnreadCountAction:', error);
    return { data: 0 };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    await NotificationService.markAsRead(notificationId);
    revalidatePath('/admin/notifications');
    return { success: true };
  } catch (error) {
    console.error('Error in markNotificationAsReadAction:', error);
    return { error: 'Failed to mark notification as read' };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsReadAction(category?: NotificationCategory) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    await NotificationService.markAllAsRead(user.id, category);
    revalidatePath('/admin/notifications');
    return { success: true };
  } catch (error) {
    console.error('Error in markAllAsReadAction:', error);
    return { error: 'Failed to mark all notifications as read' };
  }
}

/**
 * Get recent notifications for dropdown
 */
export async function getRecentNotificationsAction(limit: number = 5) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const result = await NotificationService.getRecentNotifications(user.id, limit);
    return { data: result };
  } catch (error) {
    console.error('Error in getRecentNotificationsAction:', error);
    return { error: 'Failed to fetch recent notifications' };
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStatsAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: {
          total: 0,
          unread: 0,
          read: 0,
          booking: 0,
          user: 0,
          vendor_application: 0,
          review: 0,
          payment: 0,
        }
      };
    }

    // Get all notifications for stats
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('id, is_read, category')
      .eq('user_id', user.id);

    if (!allNotifications) {
      return {
        data: {
          total: 0,
          unread: 0,
          read: 0,
          booking: 0,
          user: 0,
          vendor_application: 0,
          review: 0,
          payment: 0,
        }
      };
    }

    const stats = {
      total: allNotifications.length,
      unread: allNotifications.filter(n => !n.is_read).length,
      read: allNotifications.filter(n => n.is_read).length,
      booking: allNotifications.filter(n => n.category === 'booking').length,
      user: allNotifications.filter(n => n.category === 'user').length,
      vendor_application: allNotifications.filter(n => n.category === 'vendor_application').length,
      review: allNotifications.filter(n => n.category === 'review').length,
      payment: allNotifications.filter(n => n.category === 'payment').length,
    };

    return { data: stats };
  } catch (error) {
    console.error('Error in getNotificationStatsAction:', error);
    return {
      data: {
        total: 0,
        unread: 0,
        read: 0,
        booking: 0,
        user: 0,
        vendor_application: 0,
        review: 0,
        payment: 0,
      }
    };
  }
}

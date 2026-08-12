'use server';

import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/lib/notifications/notification-service';
import { NotificationCategory, NotificationPurgePreview } from '@/lib/notifications/types';
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
 * Delete a single notification
 */
export async function deleteNotificationAction(notificationId: string) {
  try {
    await NotificationService.deleteNotification(notificationId);
    revalidatePath('/admin/notifications');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteNotificationAction:', error);
    return { error: 'Failed to delete notification' };
  }
}

/**
 * Delete the current user's read notifications, optionally within one category
 */
export async function clearReadNotificationsAction(category?: NotificationCategory) {
  try {
    const deleted = await NotificationService.clearRead(category);
    revalidatePath('/admin/notifications');
    return { success: true, deleted };
  } catch (error) {
    console.error('Error in clearReadNotificationsAction:', error);
    return { error: 'Failed to clear read notifications' };
  }
}

/**
 * Preview what an admin purge would remove.
 *
 * Read-only, and paired with purgeNotificationsAction: both RPCs take the same
 * arguments and share the same predicate, so the number shown in the dialog is the
 * number that gets removed.
 *
 * Uses the session client, not the admin client, because count_notification_purge
 * reads auth.uid() to check the caller is an admin and a service-role call has no
 * auth.uid() at all.
 */
export async function previewNotificationPurgeAction(
  before: string | null,
  allUsers: boolean
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('count_notification_purge', {
      p_before: before ?? undefined,
      p_all_users: allUsers,
    });

    if (error) {
      console.error('Error in previewNotificationPurgeAction:', error.message);
      return { error: 'Failed to preview the purge' };
    }

    // The RPC is typed as Json because it returns jsonb. Its shape is fixed by
    // jsonb_build_object in count_notification_purge.
    return { data: data as unknown as NotificationPurgePreview };
  } catch (error) {
    console.error('Error in previewNotificationPurgeAction:', error);
    return { error: 'Failed to preview the purge' };
  }
}

/**
 * Table-wide notification counts, across every user.
 *
 * Deliberately reuses count_notification_purge rather than adding a near-identical
 * function: called with (null, true) it already means "every row, all users", which is
 * exactly this stat, and it already carries the admin check. The name reads oddly here
 * for that reason, so this is not a copy-paste slip.
 *
 * This exists because getNotificationStatsAction below filters on the current user, so
 * the page's "Total" card is one admin's feed. With no platform-wide number anywhere,
 * rows belonging to other users were invisible, and an admin who cleared their own feed
 * saw an empty page while the table still held rows.
 */
export async function getPlatformNotificationStatsAction() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('count_notification_purge', {
      p_before: undefined,
      p_all_users: true,
    });

    if (error) {
      console.error('Error in getPlatformNotificationStatsAction:', error.message);
      return { data: null };
    }

    return { data: data as unknown as NotificationPurgePreview };
  } catch (error) {
    console.error('Error in getPlatformNotificationStatsAction:', error);
    return { data: null };
  }
}

/**
 * Delete notifications older than a cutoff. `before` of null means every row.
 * The function writes a notifications_purged row to user_activity_logs.
 */
export async function purgeNotificationsAction(before: string | null, allUsers: boolean) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('purge_notifications', {
      p_before: before ?? undefined,
      p_all_users: allUsers,
    });

    if (error) {
      console.error('Error in purgeNotificationsAction:', error.message);
      return { error: error.message };
    }

    revalidatePath('/admin/notifications');
    return { success: true, deleted: data ?? 0 };
  } catch (error) {
    console.error('Error in purgeNotificationsAction:', error);
    return { error: 'Failed to clear notifications' };
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

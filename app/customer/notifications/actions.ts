'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NotificationCategory, NotificationsResponse } from '@/lib/notifications/types';

interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Get notifications for customer
export async function getNotificationsAction(
  category?: NotificationCategory,
  page: number = 1,
  limit: number = 20
): Promise<ActionResponse<NotificationsResponse>> {
  try {
    const supabase = createServerActionClient({ cookies });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply category filter if provided
    if (category && category !== 'system') {
      query = query.eq('category', category);
    }

    const { data: notifications, error: notificationsError, count } = await query;

    if (notificationsError) {
      return { success: false, error: notificationsError.message };
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system'])
      .eq('is_read', false);

    if (countError) {
      return { success: false, error: countError.message };
    }

    return {
      success: true,
      data: {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
        total: count || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get unread notification count
export async function getUnreadCountAction(
  category?: NotificationCategory
): Promise<ActionResponse<number>> {
  try {
    const supabase = createServerActionClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system'])
      .eq('is_read', false);

    if (category) {
      query = query.eq('category', category);
    }

    const { count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: count || 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Mark notification as read
export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResponse> {
  try {
    const supabase = createServerActionClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Mark all notifications as read
export async function markAllAsReadAction(
  category?: NotificationCategory
): Promise<ActionResponse> {
  try {
    const supabase = createServerActionClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system'])
      .eq('is_read', false);

    if (category) {
      query = query.eq('category', category);
    }

    const { error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get recent notifications
export async function getRecentNotificationsAction(
  limit: number = 5
): Promise<ActionResponse> {
  try {
    const supabase = createServerActionClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get notification statistics
export async function getNotificationStatsAction(): Promise<ActionResponse> {
  try {
    const supabase = createServerActionClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get total count
    const { count: total } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system']);

    // Get unread count
    const { count: unread } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system'])
      .eq('is_read', false);

    // Get read count
    const { count: read } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('category', ['booking', 'payment', 'system'])
      .eq('is_read', true);

    // Get counts by category
    const { count: booking } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'booking');

    const { count: payment } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'payment');

    const { count: system } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'system');

    return {
      success: true,
      data: {
        total: total || 0,
        unread: unread || 0,
        read: read || 0,
        booking: booking || 0,
        payment: payment || 0,
        system: system || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

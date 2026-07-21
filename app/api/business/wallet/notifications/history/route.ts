/**
 * Notification History API
 * GET: Retrieve paginated notification history with filters
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';

/**
 * GET: Retrieve notification history
 *
 * Wallet notification history is business-level, so it is owner-only. Using
 * requireBusinessOwner also brings the is_active / account-status checks this
 * route previously skipped by hand-rolling its own auth.
 */
export const GET = requireBusinessOwner(async (request: NextRequest, user) => {
  try {
    const supabase = await createClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const notificationType = searchParams.get('notification_type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return apiError('Invalid pagination parameters', 400);
    }

    // Build query
    let query = supabase
      .from('wallet_notification_history')
      .select('*', { count: 'exact' })
      .eq('business_account_id', user.businessAccountId);

    // Apply filters
    if (notificationType) {
      query = query.eq('notification_type', notificationType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    // Execute query
    const { data: notifications, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching notification history:', queryError);
      return apiError('Failed to fetch notification history', 500);
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return apiSuccess({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return apiError('Failed to fetch notification history', 500);
  }
});

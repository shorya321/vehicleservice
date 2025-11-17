/**
 * Auto-Recharge History API
 * View auto-recharge attempts and statistics
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';

/**
 * GET /api/business/wallet/auto-recharge/history
 * Retrieve auto-recharge attempts history with filtering and pagination
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status'); // pending, processing, succeeded, failed, cancelled
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    // Build query
    let query = supabase
      .from('auto_recharge_attempts')
      .select('*', { count: 'exact' })
      .eq('business_account_id', user.businessAccountId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data: attempts, error, count } = await query;

    if (error) {
      console.error('Error fetching auto-recharge history:', error);
      return apiError('Failed to fetch history', 500);
    }

    // Get monthly spending summary
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: monthlySpending } = await supabase
      .from('auto_recharge_monthly_spending')
      .select('*')
      .eq('business_account_id', user.businessAccountId)
      .gte('month', `${currentMonth}-01`)
      .single();

    // Get statistics
    const { data: stats } = await supabase
      .from('auto_recharge_attempts')
      .select('status')
      .eq('business_account_id', user.businessAccountId);

    const statistics = {
      total: stats?.length || 0,
      succeeded: stats?.filter((s) => s.status === 'succeeded').length || 0,
      failed: stats?.filter((s) => s.status === 'failed').length || 0,
      pending: stats?.filter((s) => s.status === 'pending').length || 0,
      processing: stats?.filter((s) => s.status === 'processing').length || 0,
      currentMonthTotal: monthlySpending?.total_recharged || 0,
      currentMonthCount: monthlySpending?.recharge_count || 0,
    };

    return apiSuccess({
      attempts: attempts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error('Auto-recharge history GET error:', error);
    return apiError('Internal server error', 500);
  }
});

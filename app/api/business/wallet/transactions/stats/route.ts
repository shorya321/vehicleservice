/**
 * Transaction Statistics API
 * Comprehensive statistics for wallet transactions
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';

/**
 * GET /api/business/wallet/transactions/stats
 * Get comprehensive transaction statistics with optional filtering
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);

    // Filters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const transactionTypes = searchParams.get('transaction_types'); // Comma-separated
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const currency = searchParams.get('currency');

    // Call get_transaction_statistics function
    const { data: statistics, error } = await supabase.rpc('get_transaction_statistics', {
      p_business_account_id: user.businessAccountId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_transaction_types: transactionTypes ? transactionTypes.split(',') : null,
      p_min_amount: minAmount ? parseFloat(minAmount) : null,
      p_max_amount: maxAmount ? parseFloat(maxAmount) : null,
      p_currency: currency || null,
    });

    if (error) {
      console.error('Error fetching transaction statistics:', error);
      return apiError('Failed to fetch statistics', 500);
    }

    // Get monthly trends
    const { data: monthlyTrends, error: monthlyError } = await supabase
      .from('monthly_transaction_summary')
      .select('*')
      .eq('business_account_id', user.businessAccountId)
      .order('month', { ascending: false })
      .limit(12); // Last 12 months

    if (monthlyError) {
      console.error('Error fetching monthly trends:', monthlyError);
    }

    // Get daily trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyTrends, error: dailyError } = await supabase
      .from('daily_transaction_summary')
      .select('*')
      .eq('business_account_id', user.businessAccountId)
      .gte('day', thirtyDaysAgo.toISOString())
      .order('day', { ascending: false });

    if (dailyError) {
      console.error('Error fetching daily trends:', dailyError);
    }

    return apiSuccess({
      statistics: statistics || {},
      trends: {
        monthly: monthlyTrends || [],
        daily: dailyTrends || [],
      },
      filters: {
        startDate,
        endDate,
        transactionTypes: transactionTypes ? transactionTypes.split(',') : null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        currency,
      },
    });
  } catch (error) {
    console.error('Transaction statistics error:', error);
    return apiError('Internal server error', 500);
  }
});

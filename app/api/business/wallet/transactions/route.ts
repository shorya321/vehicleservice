/**
 * Enhanced Transactions API
 * Advanced filtering, search, and pagination for wallet transactions
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';

/**
 * GET /api/business/wallet/transactions
 * Retrieve transactions with advanced filtering and search
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = (page - 1) * limit;

    // Filters
    const transactionType = searchParams.get('transaction_type'); // credit_added, booking_deduction, refund, admin_adjustment
    const startDate = searchParams.get('start_date'); // ISO date string
    const endDate = searchParams.get('end_date'); // ISO date string
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const currency = searchParams.get('currency');
    const searchQuery = searchParams.get('search'); // For description search
    const referenceId = searchParams.get('reference_id'); // For specific booking/reference

    // Build query
    let query = supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('business_account_id', user.businessAccountId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }

    if (currency) {
      query = query.eq('currency', currency);
    }

    if (referenceId) {
      query = query.eq('reference_id', referenceId);
    }

    // Apply search if provided (full-text search on description)
    if (searchQuery) {
      // Use the search_transactions function for full-text search
      const { data: searchResults, error: searchError } = await supabase.rpc(
        'search_transactions',
        {
          p_business_account_id: user.businessAccountId,
          p_search_query: searchQuery,
          p_limit: limit,
        }
      );

      if (searchError) {
        console.error('Error searching transactions:', searchError);
        return apiError('Failed to search transactions', 500);
      }

      return apiSuccess({
        transactions: searchResults || [],
        pagination: {
          page,
          limit,
          total: searchResults?.length || 0,
          totalPages: 1, // Search doesn't support pagination
        },
        isSearchResult: true,
      });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return apiError('Failed to fetch transactions', 500);
    }

    return apiSuccess({
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: {
        transactionType,
        startDate,
        endDate,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        currency,
        searchQuery,
        referenceId,
      },
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return apiError('Internal server error', 500);
  }
});

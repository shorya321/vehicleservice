/**
 * Admin Wallet Information API Route
 * Allows admins to view complete wallet information for a business
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/business/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return apiError('Forbidden: Admin access required', 403);
    }

    const businessAccountId = id;

    // Get business account with all wallet information
    const { data: businessAccount, error } = await supabase
      .from('business_accounts')
      .select(`
        id,
        business_name,
        wallet_balance,
        preferred_currency,
        wallet_frozen,
        wallet_frozen_at,
        wallet_frozen_reason,
        max_transaction_amount,
        max_daily_spend,
        max_monthly_spend,
        spending_limits_enabled,
        created_at,
        updated_at
      `)
      .eq('id', businessAccountId)
      .single();

    if (error || !businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Get frozen by admin details if wallet is frozen
    let frozenByAdmin = null;
    if (businessAccount.wallet_frozen) {
      const { data: freezeInfo } = await supabase
        .from('admin_wallet_audit_log')
        .select('admin_user_id, created_at')
        .eq('business_account_id', businessAccountId)
        .eq('action_type', 'freeze_wallet')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (freezeInfo) {
        const { data: adminUser } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', freezeInfo.admin_user_id)
          .single();

        if (adminUser) {
          frozenByAdmin = {
            id: adminUser.id,
            name: adminUser.full_name,
            email: adminUser.email,
            frozen_at: freezeInfo.created_at,
          };
        }
      }
    }

    // Get recent transactions (last 10)
    const { data: recentTransactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('business_account_id', businessAccountId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get transaction statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: stats } = await supabase.rpc('get_transaction_statistics', {
      p_business_account_id: businessAccountId,
      p_start_date: thirtyDaysAgo.toISOString(),
      p_end_date: new Date().toISOString(),
      p_transaction_types: null,
      p_min_amount: null,
      p_max_amount: null,
      p_currency: null,
    });

    // Calculate current spending for limits check
    let currentSpending = null;
    if (businessAccount.spending_limits_enabled) {
      // Get today's spending
      const { data: dailyTransactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('business_account_id', businessAccountId)
        .lt('amount', 0)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const dailySpend = dailyTransactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

      // Get this month's spending
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthlyTransactions } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('business_account_id', businessAccountId)
        .lt('amount', 0)
        .gte('created_at', monthStart.toISOString());

      const monthlySpend = monthlyTransactions?.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

      currentSpending = {
        daily: dailySpend,
        monthly: monthlySpend,
        daily_remaining: businessAccount.max_daily_spend ? businessAccount.max_daily_spend - dailySpend : null,
        monthly_remaining: businessAccount.max_monthly_spend ? businessAccount.max_monthly_spend - monthlySpend : null,
      };
    }

    return apiSuccess({
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
        created_at: businessAccount.created_at,
      },
      wallet: {
        balance: businessAccount.wallet_balance,
        currency: businessAccount.preferred_currency,
        frozen: businessAccount.wallet_frozen,
        frozen_at: businessAccount.wallet_frozen_at,
        frozen_reason: businessAccount.wallet_frozen_reason,
        frozen_by: frozenByAdmin,
      },
      spending_limits: {
        enabled: businessAccount.spending_limits_enabled,
        max_transaction_amount: businessAccount.max_transaction_amount,
        max_daily_spend: businessAccount.max_daily_spend,
        max_monthly_spend: businessAccount.max_monthly_spend,
        current_spending: currentSpending,
      },
      recent_transactions: recentTransactions || [],
      statistics_30_days: stats,
      updated_at: businessAccount.updated_at,
    });
  } catch (error) {
    console.error('Error fetching wallet information:', error);
    return apiError('Internal server error', 500);
  }
}

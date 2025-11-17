/**
 * Admin Spending Limits API Route
 * Allows admins to set/update spending limits for business wallets
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/business/api-utils';
import { z } from 'zod';

// Validation schema
const spendingLimitsSchema = z.object({
  max_transaction_amount: z.number().positive().nullable().optional(),
  max_daily_spend: z.number().positive().nullable().optional(),
  max_monthly_spend: z.number().positive().nullable().optional(),
  enabled: z.boolean().default(true),
  reason: z.string().min(5, 'Reason must be at least 5 characters').default('Updated spending limits'),
});

/**
 * GET - Get current spending limits for a business
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const businessAccountId = params.id;

    // Get business account with spending limits
    const { data: businessAccount, error } = await supabase
      .from('business_accounts')
      .select(`
        id,
        business_name,
        wallet_balance,
        max_transaction_amount,
        max_daily_spend,
        max_monthly_spend,
        spending_limits_enabled
      `)
      .eq('id', businessAccountId)
      .single();

    if (error || !businessAccount) {
      return apiError('Business account not found', 404);
    }

    return apiSuccess({
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
        wallet_balance: businessAccount.wallet_balance,
      },
      limits: {
        max_transaction_amount: businessAccount.max_transaction_amount,
        max_daily_spend: businessAccount.max_daily_spend,
        max_monthly_spend: businessAccount.max_monthly_spend,
        enabled: businessAccount.spending_limits_enabled,
      },
    });
  } catch (error) {
    console.error('Error fetching spending limits:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * PUT - Set/update spending limits for a business
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Parse and validate request body
    const body = await request.json();
    const validation = spendingLimitsSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.errors[0].message, 400);
    }

    const {
      max_transaction_amount,
      max_daily_spend,
      max_monthly_spend,
      enabled,
      reason,
    } = validation.data;
    const businessAccountId = params.id;

    // Verify business account exists
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, business_name')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Call set_spending_limits function
    const { data: result, error } = await supabase.rpc('set_spending_limits', {
      p_business_account_id: businessAccountId,
      p_admin_user_id: user.id,
      p_max_transaction_amount: max_transaction_amount ?? null,
      p_max_daily_spend: max_daily_spend ?? null,
      p_max_monthly_spend: max_monthly_spend ?? null,
      p_enabled: enabled,
      p_reason: reason,
    });

    if (error) {
      console.error('Error setting spending limits:', error);
      return apiError(error.message, 400);
    }

    return apiSuccess({
      message: 'Spending limits updated successfully',
      result,
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
      },
    });
  } catch (error) {
    console.error('Error in set spending limits:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * DELETE - Remove all spending limits (disable limits)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const businessAccountId = params.id;

    // Verify business account exists
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, business_name')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Call set_spending_limits with null values and disabled
    const { data: result, error } = await supabase.rpc('set_spending_limits', {
      p_business_account_id: businessAccountId,
      p_admin_user_id: user.id,
      p_max_transaction_amount: null,
      p_max_daily_spend: null,
      p_max_monthly_spend: null,
      p_enabled: false,
      p_reason: 'Spending limits removed by admin',
    });

    if (error) {
      console.error('Error removing spending limits:', error);
      return apiError(error.message, 400);
    }

    return apiSuccess({
      message: 'Spending limits removed successfully',
      result,
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
      },
    });
  } catch (error) {
    console.error('Error in remove spending limits:', error);
    return apiError('Internal server error', 500);
  }
}

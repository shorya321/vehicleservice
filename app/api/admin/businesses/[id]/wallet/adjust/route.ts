/**
 * Admin Wallet Adjustment API Route
 * Allows admins to manually adjust business wallet balances
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/business/api-utils';
import { z } from 'zod';

// Validation schema
const adjustWalletSchema = z.object({
  amount: z.number().refine((val) => val !== 0, {
    message: 'Amount cannot be zero',
  }),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  currency: z.string().length(3).default('USD'),
});

export async function POST(
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
    const validation = adjustWalletSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.errors[0].message, 400);
    }

    const { amount, reason, currency } = validation.data;
    const businessAccountId = params.id;

    // Verify business account exists
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, business_name, wallet_balance')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Call admin_adjust_wallet function
    const { data: result, error } = await supabase.rpc('admin_adjust_wallet', {
      p_business_account_id: businessAccountId,
      p_admin_user_id: user.id,
      p_amount: amount,
      p_reason: reason,
      p_currency: currency,
    });

    if (error) {
      console.error('Error adjusting wallet:', error);
      return apiError(error.message, 400);
    }

    return apiSuccess({
      message: 'Wallet adjusted successfully',
      adjustment: result,
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
      },
    });
  } catch (error) {
    console.error('Error in wallet adjustment:', error);
    return apiError('Internal server error', 500);
  }
}

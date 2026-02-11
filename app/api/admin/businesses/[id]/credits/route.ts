/**
 * Admin Credits Adjustment API
 * Allows admins to add or deduct credits from business wallets
 */

import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { adminCreditAdjustmentSchema } from '@/lib/business/validators';
import { formatCurrency } from '@/lib/business/wallet-operations';

/**
 * POST /api/admin/businesses/[id]/credits
 * Adjust wallet credits for a business account
 */
export const POST = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const businessId = id;

    // Verify admin authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('Unauthorized', 401);
    }

    // Check admin role
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
    const validationResult = adminCreditAdjustmentSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError(
        'Invalid input: ' + validationResult.error.errors[0].message,
        400
      );
    }

    const { amount, reason } = validationResult.data;

    // Use admin client to adjust credits
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    try {
      // Call add_to_wallet function (works for both positive and negative amounts)
      const { data: newBalance, error } = await supabaseAdmin.rpc('add_to_wallet', {
        p_business_id: businessId,
        p_amount: amount,
        p_transaction_type: 'admin_adjustment',
        p_description: `Admin adjustment: ${reason}`,
        p_created_by: `admin:${user.email}`,
        p_reference_id: null,
        p_stripe_payment_intent_id: null,
      });

      if (error) {
        console.error('Credit adjustment error:', error);
        return apiError(error.message || 'Failed to adjust credits', 500);
      }

      return apiSuccess({
        message: 'Credits adjusted successfully',
        adjustment: formatCurrency(amount),
        new_balance: formatCurrency(newBalance),
      });
    } catch (error) {
      console.error('Admin credits API error:', error);
      return apiError('Failed to adjust credits', 500);
    }
  }
);

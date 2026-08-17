/**
 * Admin Business Status Update API
 * Allows admins to change business account status
 */

import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { businessStatusSchema } from '@/lib/business/validators';
import {
  approveBusinessAccount,
  rejectBusinessAccount,
} from '@/lib/business/admin/account-status';

/**
 * PUT /api/admin/businesses/[id]/status
 * Update business account status
 */
export const PUT = withErrorHandling(
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
    const validationResult = businessStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError(
        'Invalid input: ' + validationResult.error.errors[0].message,
        400
      );
    }

    const { status } = validationResult.data;

    // Use admin client to update status
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
      // Deciding a pending account from this dropdown is an approval or a rejection
      // by another name, and owes the owner the same email the dedicated buttons
      // send. Route those two through the shared helper; everything else - suspend,
      // reactivate, inactive - has no template yet and stays a plain update.
      const { data: current } = await supabaseAdmin
        .from('business_accounts')
        .select('status')
        .eq('id', businessId)
        .maybeSingle();

      if (!current) {
        return apiError('Business account not found', 404);
      }

      if (current.status === 'pending' && (status === 'active' || status === 'rejected')) {
        const result =
          status === 'active'
            ? await approveBusinessAccount(businessId)
            : await rejectBusinessAccount(businessId);

        if (!result.success) {
          return apiError(result.error || 'Failed to update status', 400);
        }

        return apiSuccess({
          message: 'Status updated successfully',
          new_status: status,
          email_delivered: result.emailDelivered,
        });
      }

      const { error } = await supabaseAdmin
        .from('business_accounts')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (error) {
        console.error('Status update error:', error);
        return apiError('Failed to update status', 500);
      }

      return apiSuccess({
        message: 'Status updated successfully',
        new_status: status,
      });
    } catch (error) {
      console.error('Admin status API error:', error);
      return apiError('Failed to update status', 500);
    }
  }
);

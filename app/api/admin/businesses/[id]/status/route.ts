/**
 * Admin Business Status Update API
 * Allows admins to change business account status
 */

import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { businessStatusSchema } from '@/lib/business/validators';

/**
 * PUT /api/admin/businesses/[id]/status
 * Update business account status
 */
export const PUT = withErrorHandling(
  async (request: NextRequest, context: { params: { id: string } }) => {
    const businessId = context.params.id;

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

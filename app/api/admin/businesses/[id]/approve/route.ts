/**
 * Admin Business Approval API
 * Allows admins to approve pending business account registrations
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { approveBusinessAccount } from '@/lib/business/admin/account-status';

/**
 * PUT /api/admin/businesses/[id]/approve
 * Approve a pending business account
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

    const result = await approveBusinessAccount(businessId);

    if (!result.success) {
      // "not found" and "already decided" are the only two ways the claim can fail
      // without a thrown error; the message distinguishes them.
      const status = result.error === 'Business account not found' ? 404 : 400;
      return apiError(result.error || 'Failed to approve business account', status);
    }

    return apiSuccess({
      message: 'Business account approved successfully',
      business_id: businessId,
      business_name: result.businessName,
      new_status: 'active',
      email_delivered: result.emailDelivered,
    });
  }
);

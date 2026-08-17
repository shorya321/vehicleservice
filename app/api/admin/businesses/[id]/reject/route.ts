/**
 * Admin Business Rejection API
 * Allows admins to reject pending business account registrations
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { rejectBusinessAccount } from '@/lib/business/admin/account-status';
import { z } from 'zod';

/**
 * Rejection Request Schema
 */
const rejectBusinessSchema = z.object({
  rejection_reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500).optional(),
});

/**
 * PUT /api/admin/businesses/[id]/reject
 * Reject a pending business account
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

    // Parse and validate optional rejection reason
    let rejectionReason: string | undefined;
    try {
      const body = await request.json();
      const validationResult = rejectBusinessSchema.safeParse(body);

      if (validationResult.success) {
        rejectionReason = validationResult.data.rejection_reason;
      }
    } catch {
      // If no body or invalid JSON, that's fine - rejection reason is optional
      rejectionReason = undefined;
    }

    const result = await rejectBusinessAccount(businessId, rejectionReason);

    if (!result.success) {
      const status = result.error === 'Business account not found' ? 404 : 400;
      return apiError(result.error || 'Failed to reject business account', status);
    }

    return apiSuccess({
      message: 'Business account rejected successfully',
      business_id: businessId,
      business_name: result.businessName,
      new_status: 'rejected',
      rejection_reason: rejectionReason,
      email_delivered: result.emailDelivered,
    });
  }
);

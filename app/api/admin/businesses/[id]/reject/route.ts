/**
 * Admin Business Rejection API
 * Allows admins to reject pending business account registrations
 */

import { NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/business/api-utils';
import { sendBusinessRejectionEmail } from '@/lib/email/services/business-emails';
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
      // First, check if business exists and is in pending status
      const { data: business, error: fetchError } = await supabaseAdmin
        .from('business_accounts')
        .select('id, status, business_name, business_email')
        .eq('id', businessId)
        .single();

      if (fetchError || !business) {
        return apiError('Business account not found', 404);
      }

      if (business.status !== 'pending') {
        return apiError(
          `Cannot reject business with status '${business.status}'. Only pending businesses can be rejected.`,
          400
        );
      }

      // Update status to rejected
      const { error: updateError } = await supabaseAdmin
        .from('business_accounts')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Rejection update error:', updateError);
        return apiError('Failed to reject business account', 500);
      }

      // Get the owner's name from business_users
      const { data: ownerUser } = await supabaseAdmin
        .from('business_users')
        .select('full_name')
        .eq('business_account_id', businessId)
        .eq('role', 'owner')
        .single();

      const ownerName = ownerUser?.full_name || 'Business Owner';

      // Send rejection notification email
      const emailResult = await sendBusinessRejectionEmail({
        email: business.business_email,
        businessName: business.business_name,
        ownerName,
        reason: rejectionReason,
        supportEmail: 'support@vehicleservice.com',
      });

      if (!emailResult.success) {
        console.error('Failed to send rejection email:', emailResult.error);
        // Don't fail the rejection if email fails - log and continue
      } else {
        console.log('Rejection email sent successfully:', emailResult.emailId);
      }

      return apiSuccess({
        message: 'Business account rejected successfully',
        business_id: businessId,
        business_name: business.business_name,
        new_status: 'rejected',
        rejection_reason: rejectionReason,
      });
    } catch (error) {
      console.error('Admin reject API error:', error);
      return apiError('Failed to reject business account', 500);
    }
  }
);

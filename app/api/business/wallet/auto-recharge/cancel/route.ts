/**
 * Cancel Auto-Recharge Attempt API
 * Allows businesses to cancel pending auto-recharge attempts
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import { z } from 'zod';

const cancelRequestSchema = z.object({
  attempt_id: z.string().uuid(),
});

/**
 * POST /api/business/wallet/auto-recharge/cancel
 * Cancel a pending auto-recharge attempt
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    // Validate request
    const validation = cancelRequestSchema.safeParse(body);
    if (!validation.success) {
      return apiError('Invalid request data', 400, validation.error.errors);
    }

    const { attempt_id } = validation.data;

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Verify attempt belongs to this business and is cancellable
    const { data: attempt, error: fetchError } = await supabase
      .from('auto_recharge_attempts')
      .select('id, status, business_account_id')
      .eq('id', attempt_id)
      .single();

    if (fetchError || !attempt) {
      return apiError('Attempt not found', 404);
    }

    if (attempt.business_account_id !== user.businessAccountId) {
      return apiError('Unauthorized', 403);
    }

    // Only pending or processing attempts can be cancelled
    if (!['pending', 'processing'].includes(attempt.status)) {
      return apiError(
        `Cannot cancel attempt with status: ${attempt.status}`,
        400
      );
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('auto_recharge_attempts')
      .update({
        status: 'cancelled',
        processed_at: new Date().toISOString(),
        error_message: 'Cancelled by user',
      })
      .eq('id', attempt_id);

    if (updateError) {
      console.error('Error cancelling auto-recharge attempt:', updateError);
      return apiError('Failed to cancel attempt', 500);
    }

    return apiSuccess({
      message: 'Auto-recharge attempt cancelled successfully',
      attempt_id,
    });
  } catch (error) {
    console.error('Auto-recharge cancel error:', error);
    return apiError('Internal server error', 500);
  }
});

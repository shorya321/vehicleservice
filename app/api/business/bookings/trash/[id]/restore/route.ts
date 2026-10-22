/**
 * POST /api/business/bookings/trash/[id]/restore
 * Brings a deleted trip back from the trash with its original booking and trip numbers.
 * Owner only, and only for the owner's own account: the RPC refuses another tenant's entry.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';

const idSchema = z.string().uuid();

export const POST = requireBusinessOwner(
  async (_request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    if (!idSchema.safeParse(id).success) {
      return apiError('Deleted booking not found', 404);
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabaseAdmin.rpc('restore_trashed_trip', {
      p_trash_id: id,
      p_business_account_id: user.businessAccountId,
      p_actor_auth_id: user.userId,
      p_actor_name: user.memberName || user.memberEmail || user.businessName,
      p_actor_role: user.role,
    });

    if (error) {
      console.error('Failed to restore business booking from the trash:', { id, error });
      // P0002: not found or another tenant's entry. P0001: a refusal written for people.
      if (error.code === 'P0002') return apiError('Deleted booking not found', 404);
      if (error.code === 'P0001') return apiError(error.message, 409);
      // 23502: a column added since the snapshot was taken has no value for it.
      if (error.code === '23502') {
        return apiError('This booking was deleted before a system update and cannot be restored here. Contact support.', 409);
      }
      if (error.code === '23503') {
        return apiError('Something this booking points to no longer exists, so it cannot be restored. Contact support.', 409);
      }
      return apiError('Failed to restore booking', 500);
    }

    return apiSuccess({ restored: true });
  }
);

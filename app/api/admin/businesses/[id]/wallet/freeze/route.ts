/**
 * Admin Wallet Freeze API Route
 * Allows admins to freeze/unfreeze business wallets
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/business/api-utils';
import { z } from 'zod';

// Validation schema for freeze
const freezeWalletSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

// Validation schema for unfreeze
const unfreezeWalletSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

/**
 * POST - Freeze a business wallet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validation = freezeWalletSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.errors[0].message, 400);
    }

    const { reason } = validation.data;
    const businessAccountId = id;

    // Verify business account exists
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, business_name, wallet_frozen')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount) {
      return apiError('Business account not found', 404);
    }

    if (businessAccount.wallet_frozen) {
      return apiError('Wallet is already frozen', 400);
    }

    // Call freeze_business_wallet function
    const { data: result, error } = await supabase.rpc('freeze_business_wallet', {
      p_business_account_id: businessAccountId,
      p_admin_user_id: user.id,
      p_reason: reason,
    });

    if (error) {
      console.error('Error freezing wallet:', error);
      return apiError(error.message, 400);
    }

    // Send wallet frozen notification (email + in-app)
    try {
      // Get admin name for notification
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const adminName = adminProfile?.full_name || 'Admin';

      // Get owner's auth_user_id for in-app notification
      const { data: ownerUser } = await supabase
        .from('business_users')
        .select('auth_user_id')
        .eq('business_account_id', businessAccountId)
        .eq('role', 'owner')
        .single();

      // Send in-app notification
      if (ownerUser?.auth_user_id) {
        await supabase.rpc('create_business_notification', {
          p_business_user_auth_id: ownerUser.auth_user_id,
          p_category: 'payment',
          p_type: 'wallet_frozen',
          p_title: 'Wallet Frozen',
          p_message: `Your wallet has been frozen. Reason: ${reason}`,
          p_data: {
            freeze_reason: reason,
            frozen_by: adminName,
          },
          p_link: '/business/wallet',
        });
      }

      // Send email notification via internal API
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          notification_type: 'wallet_frozen',
          business_account_id: businessAccountId,
          email_data: {
            freezeReason: reason,
            frozenBy: adminName,
            freezeDate: new Date().toISOString(),
          },
        }),
      });
    } catch (notifyError) {
      console.error('Failed to send wallet frozen notification:', notifyError);
      // Don't fail the freeze if notification fails
    }

    return apiSuccess({
      message: 'Wallet frozen successfully',
      result,
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
      },
    });
  } catch (error) {
    console.error('Error in wallet freeze:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * DELETE - Unfreeze a business wallet
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validation = unfreezeWalletSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.errors[0].message, 400);
    }

    const { reason } = validation.data;
    const businessAccountId = id;

    // Verify business account exists
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, business_name, wallet_frozen')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount) {
      return apiError('Business account not found', 404);
    }

    if (!businessAccount.wallet_frozen) {
      return apiError('Wallet is not frozen', 400);
    }

    // Call unfreeze_business_wallet function
    const { data: result, error } = await supabase.rpc('unfreeze_business_wallet', {
      p_business_account_id: businessAccountId,
      p_admin_user_id: user.id,
      p_reason: reason,
    });

    if (error) {
      console.error('Error unfreezing wallet:', error);
      return apiError(error.message, 400);
    }

    return apiSuccess({
      message: 'Wallet unfrozen successfully',
      result,
      business: {
        id: businessAccount.id,
        name: businessAccount.business_name,
      },
    });
  } catch (error) {
    console.error('Error in wallet unfreeze:', error);
    return apiError('Internal server error', 500);
  }
}

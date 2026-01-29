/**
 * Auto-Recharge Settings API
 * Manage auto-recharge configuration for business accounts
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import { z } from 'zod';

const autoRechargeSettingsSchema = z.object({
  enabled: z.boolean(),
  trigger_threshold: z.number().min(0),
  recharge_amount: z.number().min(10),
  max_recharge_per_month: z.number().min(0).nullable(),
  currency: z.string().length(3),
  use_default_payment_method: z.boolean(),
  payment_method_id: z.string().uuid().nullable(),
});

/**
 * GET /api/business/wallet/auto-recharge/settings
 * Retrieve current auto-recharge settings
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Fetch settings
    const { data: settings, error } = await supabase
      .from('auto_recharge_settings')
      .select('*')
      .eq('business_account_id', user.businessAccountId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error)
      console.error('Error fetching auto-recharge settings:', error);
      return apiError('Failed to fetch settings', 500);
    }

    // If no settings exist, return default values
    if (!settings) {
      return apiSuccess({
        exists: false,
        settings: {
          enabled: false,
          trigger_threshold: 100.0,
          recharge_amount: 500.0,
          max_recharge_per_month: 5000.0,
          currency: 'AED',
          use_default_payment_method: true,
          payment_method_id: null,
        },
      });
    }

    return apiSuccess({
      exists: true,
      settings,
    });
  } catch (error) {
    console.error('Auto-recharge settings GET error:', error);
    return apiError('Internal server error', 500);
  }
});

/**
 * PUT /api/business/wallet/auto-recharge/settings
 * Update auto-recharge settings
 */
export const PUT = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    // Validate request body
    const validation = autoRechargeSettingsSchema.safeParse(body);
    if (!validation.success) {
      return apiError('Invalid request data', 400, validation.error.errors);
    }

    const settingsData = validation.data;

    // Validate that recharge amount doesn't exceed monthly limit
    if (
      settingsData.max_recharge_per_month !== null &&
      settingsData.recharge_amount > settingsData.max_recharge_per_month
    ) {
      return apiError(
        'Recharge amount cannot exceed monthly limit',
        400
      );
    }

    // If using specific payment method, verify it exists and is active
    if (!settingsData.use_default_payment_method && settingsData.payment_method_id) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data: paymentMethod, error: pmError } = await supabase
        .from('payment_methods')
        .select('id, is_active')
        .eq('id', settingsData.payment_method_id)
        .eq('business_account_id', user.businessAccountId)
        .single();

      if (pmError || !paymentMethod) {
        return apiError('Payment method not found', 404);
      }

      if (!paymentMethod.is_active) {
        return apiError('Payment method is inactive', 400);
      }
    }

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Upsert settings (insert or update)
    const { data: updatedSettings, error } = await supabase
      .from('auto_recharge_settings')
      .upsert(
        {
          business_account_id: user.businessAccountId,
          ...settingsData,
        },
        {
          onConflict: 'business_account_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating auto-recharge settings:', error);
      return apiError('Failed to update settings', 500);
    }

    return apiSuccess({
      message: 'Auto-recharge settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Auto-recharge settings PUT error:', error);
    return apiError('Internal server error', 500);
  }
});

/**
 * DELETE /api/business/wallet/auto-recharge/settings
 * Delete auto-recharge settings (disable auto-recharge)
 */
export const DELETE = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { error } = await supabase
      .from('auto_recharge_settings')
      .delete()
      .eq('business_account_id', user.businessAccountId);

    if (error) {
      console.error('Error deleting auto-recharge settings:', error);
      return apiError('Failed to delete settings', 500);
    }

    return apiSuccess({
      message: 'Auto-recharge settings deleted successfully',
    });
  } catch (error) {
    console.error('Auto-recharge settings DELETE error:', error);
    return apiError('Internal server error', 500);
  }
});

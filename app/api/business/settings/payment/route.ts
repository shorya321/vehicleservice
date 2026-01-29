/**
 * Business Payment Settings API
 * Manage payment-related settings for business accounts
 */

import { NextRequest } from 'next/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * Validation schema for payment settings
 */
const paymentSettingsSchema = z.object({
  save_payment_methods: z.boolean().optional(),
  payment_element_enabled: z.boolean().optional(),
  preferred_currency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, 'Invalid currency code')
    .optional(),
});

/**
 * GET /api/business/settings/payment
 * Get current payment settings for business account
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseClient();

    const { data: settings, error } = await supabase
      .from('business_accounts')
      .select('save_payment_methods, payment_element_enabled, preferred_currency')
      .eq('id', user.businessAccountId)
      .single();

    if (error) {
      console.error('Error fetching payment settings:', error);
      return apiError('Failed to fetch payment settings', 500);
    }

    return apiSuccess({
      settings: {
        save_payment_methods: settings.save_payment_methods ?? true,
        payment_element_enabled: settings.payment_element_enabled ?? true,
        preferred_currency: settings.preferred_currency || 'AED',
      },
    });
  } catch (error) {
    console.error('Payment settings fetch error:', error);
    return apiError('Failed to fetch payment settings', 500);
  }
});

/**
 * PATCH /api/business/settings/payment
 * Update payment settings for business account
 */
export const PATCH = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();

    // Validate request body
    const validation = paymentSettingsSchema.safeParse(body);
    if (!validation.success) {
      return apiError('Invalid request data', 400);
    }

    const updates = validation.data;

    // Ensure at least one field is being updated
    if (Object.keys(updates).length === 0) {
      return apiError('No settings to update', 400);
    }

    // Use admin client for update
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: updated, error } = await supabaseAdmin
      .from('business_accounts')
      .update(updates)
      .eq('id', user.businessAccountId)
      .select('save_payment_methods, payment_element_enabled, preferred_currency')
      .single();

    if (error) {
      console.error('Error updating payment settings:', error);
      return apiError('Failed to update payment settings', 500);
    }

    return apiSuccess({
      message: 'Payment settings updated successfully',
      settings: {
        save_payment_methods: updated.save_payment_methods,
        payment_element_enabled: updated.payment_element_enabled,
        preferred_currency: updated.preferred_currency,
      },
    });
  } catch (error) {
    console.error('Payment settings update error:', error);
    return apiError('Failed to update payment settings', 500);
  }
});

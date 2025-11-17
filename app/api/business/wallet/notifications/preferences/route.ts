/**
 * Business Wallet Notification Preferences API
 * GET: Retrieve current notification preferences
 * PUT: Update notification preferences
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import { z } from 'zod';

// Validation schema for notification preferences
const notificationPreferencesSchema = z.object({
  low_balance_alert: z.object({
    enabled: z.boolean(),
    threshold: z.number().positive(),
    channels: z.array(z.enum(['email'])),
  }).optional(),
  transaction_completed: z.object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['email'])),
  }).optional(),
  auto_recharge_success: z.object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['email'])),
  }).optional(),
  auto_recharge_failed: z.object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['email'])),
  }).optional(),
  wallet_frozen: z.object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['email'])),
  }).optional(),
  spending_limit_reached: z.object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['email'])),
  }).optional(),
  monthly_statement: z.object({
    enabled: z.boolean(),
    channels: z.array(z.enum(['email'])),
    frequency: z.enum(['monthly']),
  }).optional(),
});

/**
 * GET: Retrieve notification preferences
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const supabase = await createClient();

    // Get business account using correct business account ID
    const { data: businessAccount, error: businessError } = await supabase
      .from('business_accounts')
      .select('id, business_name, notification_preferences')
      .eq('id', user.businessAccountId)
      .single();

    if (businessError || !businessAccount) {
      console.error('Error fetching business account:', businessError);
      return apiError('Business account not found', 404);
    }

    return apiSuccess({
      business_id: businessAccount.id,
      business_name: businessAccount.business_name,
      notification_preferences: businessAccount.notification_preferences || {},
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return apiError('Failed to fetch notification preferences', 500);
  }
});

/**
 * PUT: Update notification preferences
 */
export const PUT = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = notificationPreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError('Invalid notification preferences', 400);
    }

    const preferences = validationResult.data;

    // Get current business account using correct business account ID
    const { data: businessAccount, error: fetchError } = await supabase
      .from('business_accounts')
      .select('id, notification_preferences')
      .eq('id', user.businessAccountId)
      .single();

    if (fetchError || !businessAccount) {
      console.error('Error fetching business account:', fetchError);
      return apiError('Business account not found', 404);
    }

    // Merge with existing preferences
    const currentPreferences = businessAccount.notification_preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    };

    // Update notification preferences
    const { data: updatedAccount, error: updateError } = await supabase
      .from('business_accounts')
      .update({
        notification_preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.businessAccountId)
      .select('id, business_name, notification_preferences')
      .single();

    if (updateError || !updatedAccount) {
      console.error('Error updating notification preferences:', updateError);
      return apiError('Failed to update notification preferences', 500);
    }

    return apiSuccess({
      business_id: updatedAccount.id,
      business_name: updatedAccount.business_name,
      notification_preferences: updatedAccount.notification_preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return apiError('Failed to update notification preferences', 500);
  }
});

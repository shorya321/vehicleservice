/**
 * Branding Settings API
 * Manages business branding configuration (colors, brand name)
 */

import { NextRequest } from 'next/server';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { brandingSettingsSchema } from '@/lib/business/validators';

/**
 * GET /api/business/branding/settings
 * Retrieve current branding settings for the business
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();

    const { data: businessAccount, error } = await supabase
      .from('business_accounts')
      .select('brand_name, primary_color, secondary_color, accent_color, logo_url')
      .eq('id', user.businessAccountId)
      .single();

    if (error) {
      console.error('Error fetching branding settings:', error);
      return apiError('Failed to fetch branding settings', 500);
    }

    return apiSuccess({
      brand_name: businessAccount.brand_name,
      primary_color: businessAccount.primary_color,
      secondary_color: businessAccount.secondary_color,
      accent_color: businessAccount.accent_color,
      logo_url: businessAccount.logo_url,
    });
  } catch (error) {
    console.error('Branding settings fetch error:', error);
    return apiError('Failed to fetch branding settings', 500);
  }
});

/**
 * PUT /api/business/branding/settings
 * Update branding settings for the business
 */
export const PUT = requireBusinessAuth(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, brandingSettingsSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Build update object with only provided fields
    const updateData: Record<string, string> = {};
    if (body.brand_name !== undefined) updateData.brand_name = body.brand_name;
    if (body.primary_color !== undefined) updateData.primary_color = body.primary_color;
    if (body.secondary_color !== undefined) updateData.secondary_color = body.secondary_color;
    if (body.accent_color !== undefined) updateData.accent_color = body.accent_color;

    // Update branding settings
    const { data, error } = await supabase
      .from('business_accounts')
      .update(updateData)
      .eq('id', user.businessAccountId)
      .select('brand_name, primary_color, secondary_color, accent_color, logo_url')
      .single();

    if (error) {
      console.error('Error updating branding settings:', error);
      return apiError('Failed to update branding settings', 500);
    }

    return apiSuccess({
      message: 'Branding settings updated successfully',
      branding: data,
    });
  } catch (error) {
    console.error('Branding settings update error:', error);
    return apiError('Failed to update branding settings', 500);
  }
});

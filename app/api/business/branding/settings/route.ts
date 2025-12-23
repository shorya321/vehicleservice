/**
 * Branding Settings API
 * Manages business branding configuration using theme_config JSONB
 */

import { NextRequest } from 'next/server';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { brandingSettingsSchema } from '@/lib/business/validators';
import { parseThemeConfig, mergeThemeConfig, type ThemeConfig } from '@/lib/business/branding-utils';

/**
 * GET /api/business/branding/settings
 * Retrieve current branding settings (brand_name, logo_url, theme_config)
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: businessAccount, error } = await supabase
      .from('business_accounts')
      .select('brand_name, logo_url, theme_config')
      .eq('id', user.businessAccountId)
      .single();

    if (error) {
      console.error('Error fetching branding settings:', error);
      return apiError('Failed to fetch branding settings', 500);
    }

    // Parse theme_config with defaults
    const themeConfig = parseThemeConfig(businessAccount.theme_config);

    return apiSuccess({
      brand_name: businessAccount.brand_name,
      logo_url: businessAccount.logo_url,
      theme_config: themeConfig,
    });
  } catch (error) {
    console.error('Branding settings fetch error:', error);
    return apiError('Failed to fetch branding settings', 500);
  }
});

/**
 * PUT /api/business/branding/settings
 * Update branding settings (brand_name and/or theme_config)
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

    // Build update object
    const updateData: Record<string, string | ThemeConfig | null> = {};

    // Update brand_name if provided
    if (body.brand_name !== undefined) {
      updateData.brand_name = body.brand_name;
    }

    // Update theme_config if provided
    if (body.theme_config !== undefined) {
      // First fetch current theme_config to merge with
      const { data: current } = await supabase
        .from('business_accounts')
        .select('theme_config')
        .eq('id', user.businessAccountId)
        .single();

      const currentConfig = parseThemeConfig(current?.theme_config);

      // Merge new values with current config
      updateData.theme_config = mergeThemeConfig(body.theme_config, currentConfig);
    }

    // If nothing to update, return current settings
    if (Object.keys(updateData).length === 0) {
      const { data: currentSettings } = await supabase
        .from('business_accounts')
        .select('brand_name, logo_url, theme_config')
        .eq('id', user.businessAccountId)
        .single();

      return apiSuccess({
        message: 'No changes to apply',
        branding: {
          brand_name: currentSettings?.brand_name,
          logo_url: currentSettings?.logo_url,
          theme_config: parseThemeConfig(currentSettings?.theme_config),
        },
      });
    }

    // Update branding settings
    const { data, error } = await supabase
      .from('business_accounts')
      .update(updateData)
      .eq('id', user.businessAccountId)
      .select('brand_name, logo_url, theme_config')
      .single();

    if (error) {
      console.error('Error updating branding settings:', error);
      return apiError('Failed to update branding settings', 500);
    }

    return apiSuccess({
      message: 'Branding settings updated successfully',
      branding: {
        brand_name: data.brand_name,
        logo_url: data.logo_url,
        theme_config: parseThemeConfig(data.theme_config),
      },
    });
  } catch (error) {
    console.error('Branding settings update error:', error);
    return apiError('Failed to update branding settings', 500);
  }
});

/**
 * Admin/Vendor Theme Server Utilities
 * Server-side database operations for theme settings
 * NOTE: This file uses next/headers and must only be imported in Server Components
 */

import { createClient } from '@/lib/supabase/server';
import type { AdminThemeConfig } from './theme-utils';
import { DEFAULT_ADMIN_THEME, mergeWithDefaults } from './theme-utils';

const THEME_SETTINGS_NAME = 'admin-vendor-portal';

/**
 * Fetch admin/vendor theme settings from database
 * Server-side only - uses createClient from server
 */
export async function getAdminThemeSettings(): Promise<AdminThemeConfig> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('theme_settings')
      .select('config')
      .eq('name', THEME_SETTINGS_NAME)
      .single();

    if (error || !data?.config) {
      console.warn('Failed to fetch admin theme, using defaults:', error?.message);
      return DEFAULT_ADMIN_THEME;
    }

    // Merge with defaults to ensure all properties exist
    return mergeWithDefaults(data.config as Partial<AdminThemeConfig>);
  } catch (err) {
    console.error('Error fetching admin theme:', err);
    return DEFAULT_ADMIN_THEME;
  }
}

/**
 * Update admin/vendor theme settings in database
 * Server-side only - uses createClient from server
 */
export async function updateAdminThemeSettings(
  config: AdminThemeConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('theme_settings')
      .update({
        config,
        updated_at: new Date().toISOString(),
      })
      .eq('name', THEME_SETTINGS_NAME);

    if (error) {
      console.error('Failed to update admin theme:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error updating admin theme:', err);
    return { success: false, error: 'Unknown error occurred' };
  }
}

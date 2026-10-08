import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseBusinessTripSettings, type BusinessTripSettings } from './settings';

/**
 * Reads the trip-type settings straight from `site_settings`.
 * SCOPE: Business module ONLY.
 *
 * Not cached on purpose: the admin toggles take effect on the next booking, and this is one
 * single-row read per quote or create.
 */
export async function getBusinessTripSettings(supabase: SupabaseClient): Promise<BusinessTripSettings> {
  const { data, error } = await supabase.from('site_settings').select('config').limit(1).maybeSingle();
  if (error) {
    console.error('[business trips] settings read failed:', error.message);
  }
  const config = (data?.config ?? null) as Record<string, unknown> | null;
  return parseBusinessTripSettings(config?.trip_types);
}

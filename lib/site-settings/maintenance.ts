import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * Reads the site-wide maintenance flag directly from the `site_settings` row.
 *
 * Intended for use in middleware (`proxy.ts`) where the anon SSR client can read
 * the row (RLS allows public SELECT) — a fresh read so the admin toggle takes
 * effect immediately, bypassing the 1h `unstable_cache` in `getSiteSettings`.
 *
 * Fails open: any error returns `false`, so a DB hiccup never locks out the site.
 */
export async function isMaintenanceMode(
  client: SupabaseClient<Database>
): Promise<boolean> {
  try {
    const { data, error } = await client
      .from('site_settings')
      .select('config')
      .limit(1)
      .single()

    if (error || !data?.config) {
      return false
    }

    const config = data.config as { maintenance_mode?: unknown }
    return config.maintenance_mode === true
  } catch (error) {
    console.error('[Maintenance] Error reading maintenance flag:', error)
    return false
  }
}

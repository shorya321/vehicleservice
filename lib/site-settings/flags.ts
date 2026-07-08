import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export interface SiteFlags {
  maintenanceMode: boolean
  blockIndexing: boolean
}

/**
 * Reads the site-wide runtime flags directly from the `site_settings` row.
 *
 * Intended for middleware (`proxy.ts`) where the anon SSR client can read the
 * row (RLS allows public SELECT). One fresh read serves both flags, bypassing
 * the 1h `unstable_cache` in `getSiteSettings` so admin toggles take effect
 * immediately.
 *
 * Fail behavior is asymmetric by design:
 * - `maintenanceMode` fails OPEN (`false`) — a DB hiccup never locks out the site.
 * - `blockIndexing` fails SAFE (`true`) — a DB hiccup never exposes demo content
 *   to crawlers. Matches the missing-key default in `parseSiteSettings`.
 */
export async function readSiteFlags(
  client: SupabaseClient<Database>
): Promise<SiteFlags> {
  try {
    const { data, error } = await client
      .from('site_settings')
      .select('config')
      .limit(1)
      .single()

    if (error || !data?.config) {
      return { maintenanceMode: false, blockIndexing: true }
    }

    const config = data.config as {
      maintenance_mode?: unknown
      block_search_indexing?: unknown
    }

    return {
      maintenanceMode: config.maintenance_mode === true,
      // Only an explicit `false` unblocks — anything else (missing/error) blocks.
      blockIndexing: config.block_search_indexing !== false,
    }
  } catch (error) {
    console.error('[SiteFlags] Error reading site flags:', error)
    return { maintenanceMode: false, blockIndexing: true }
  }
}

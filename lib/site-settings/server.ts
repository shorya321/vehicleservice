import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SiteSettingsConfig } from './types'
import { DEFAULT_SITE_SETTINGS, parseSiteSettings } from './types'
import { parseTripSettings } from '@/lib/trips/settings'

const CACHE_TAGS = {
  siteSettings: 'site-settings',
}

const getCachedSiteSettings = unstable_cache(
  async (): Promise<SiteSettingsConfig> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('site_settings')
        .select('config')
        .limit(1)
        .single()

      if (error || !data?.config) {
        console.error('[SiteSettings] Error fetching site settings:', error)
        return DEFAULT_SITE_SETTINGS
      }

      return parseSiteSettings(data.config)
    } catch (error) {
      console.error('[SiteSettings] Error in getSiteSettings:', error)
      return DEFAULT_SITE_SETTINGS
    }
  },
  // v2: the config gained `trip_types`. A new key keeps an entry cached by an older
  // build (which the data cache can outlive a deploy with) from being served here.
  ['site-settings', 'v2'],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.siteSettings],
  }
)

/**
 * The operating site settings. Normalised on the way out as well as in, so a cached
 * value missing a newer key still reads with that key's default instead of throwing.
 */
export async function getSiteSettings(): Promise<SiteSettingsConfig> {
  const cached = await getCachedSiteSettings()
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...cached,
    trip_types: parseTripSettings(cached?.trip_types),
  }
}

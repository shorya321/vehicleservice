import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SiteSettingsConfig } from './types'
import { DEFAULT_SITE_SETTINGS, parseSiteSettings } from './types'

const CACHE_TAGS = {
  siteSettings: 'site-settings',
}

export const getSiteSettings = unstable_cache(
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
  ['site-settings'],
  {
    revalidate: 3600,
    tags: [CACHE_TAGS.siteSettings],
  }
)

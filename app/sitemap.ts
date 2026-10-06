import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/site-settings/server'
import { buildSitemapEntries } from '@/lib/seo/sitemap-entries'

// Rebuilt hourly rather than once at build time, so new posts and routes appear.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pre-launch: hand crawlers no URL list while demo content is blocked.
  const { block_search_indexing } = await getSiteSettings()
  if (block_search_indexing) {
    return []
  }

  return buildSitemapEntries()
}

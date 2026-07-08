import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/site-settings/server'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.infiniatransfers.com'
  const { block_search_indexing } = await getSiteSettings()

  // Pre-launch: block every crawler from the whole site, advertise no sitemap.
  if (block_search_indexing) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  // Live: allow public content, keep authenticated/portal areas out of the index.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/vendor/', '/business/', '/api/', '/account/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

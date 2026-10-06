import type { MetadataRoute } from 'next'
import { getSiteSettings } from '@/lib/site-settings/server'
import { getSiteUrl } from '@/lib/seo/site-url'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = getSiteUrl()
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
      // Portals, plus mid-booking pages that also carry noindex. Prefixes
      // without a trailing slash also match their sub-paths (/checkout/...).
      disallow: [
        '/admin/',
        '/vendor/',
        '/business/',
        '/api/',
        '/account/',
        '/checkout',
        '/payment',
        '/booking/',
        '/search/results',
        '/auth/',
        '/vendor-application',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

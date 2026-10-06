import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from './site-url'

type Entry = MetadataRoute.Sitemap[number]

/** Paths that exist as code, not rows. Query-param search pages are left out on purpose. */
const STATIC_PATHS: { path: string; changeFrequency: Entry['changeFrequency']; priority: number }[] = [
  { path: '/routes', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/reviews', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
]

function entry(path: string, lastModified: string | null, changeFrequency: Entry['changeFrequency'], priority: number): Entry {
  return {
    url: `${getSiteUrl()}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency,
    priority,
  }
}

function logError(source: string, error: { message: string } | null): void {
  if (error) {
    console.error(`[sitemap] Failed to load ${source}:`, error.message)
  }
}

/**
 * Every public URL worth indexing. Each source fails on its own: a broken
 * query drops that group from the sitemap rather than emptying it.
 */
export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const db = createAdminClient()
  const [pages, hidden, posts, categories, routes, zones] = await Promise.all([
    db.from('pages').select('id, slug, updated_at').eq('status', 'published'),
    db.from('seo_meta').select('entity_id').eq('entity_type', 'page').eq('noindex', true),
    db.from('blog_posts').select('slug, updated_at').eq('status', 'published'),
    db.from('blog_categories').select('slug, updated_at').eq('is_active', true),
    db
      .from('routes')
      .select('route_slug, updated_at, origin:locations!routes_origin_location_id_fkey(slug, country_slug)')
      .eq('is_active', true),
    db.from('zones').select('slug, updated_at').eq('is_active', true),
  ])

  logError('pages', pages.error)
  logError('seo_meta', hidden.error)
  logError('blog_posts', posts.error)
  logError('blog_categories', categories.error)
  logError('routes', routes.error)
  logError('zones', zones.error)

  const hiddenIds = new Set((hidden.data ?? []).map((row) => row.entity_id))
  // Location pages list routes from a place, so only places that start a route earn one.
  const origins = new Map<string, string>()
  for (const route of routes.data ?? []) {
    if (route.origin?.slug && route.origin.country_slug) {
      origins.set(`${route.origin.country_slug}/${route.origin.slug}`, route.origin.country_slug)
    }
  }

  return [
    ...(pages.data ?? [])
      .filter((page) => !hiddenIds.has(page.id) && page.slug !== '/become-vendor')
      .map((page) => entry(page.slug === '/' ? '' : page.slug, page.updated_at, page.slug === '/' ? 'weekly' : 'monthly', page.slug === '/' ? 1 : 0.5)),
    ...STATIC_PATHS.map((s) => entry(s.path, null, s.changeFrequency, s.priority)),
    ...(posts.data ?? []).map((post) => entry(`/blog/${post.slug}`, post.updated_at, 'monthly', 0.6)),
    ...(categories.data ?? []).map((c) => entry(`/blog/category/${c.slug}`, c.updated_at, 'weekly', 0.4)),
    ...(routes.data ?? [])
      .filter((route) => route.origin?.country_slug)
      .map((route) => entry(`/search/route/${route.origin?.country_slug}/${route.route_slug}`, route.updated_at, 'weekly', 0.8)),
    ...Array.from(origins.keys()).map((key) => entry(`/search/location/${key}`, null, 'weekly', 0.6)),
    ...(zones.data ?? []).map((zone) => entry(`/zones/${zone.slug}`, zone.updated_at, 'monthly', 0.5)),
  ]
}

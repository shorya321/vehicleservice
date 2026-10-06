import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from './site-url'

type Entry = MetadataRoute.Sitemap[number]

/**
 * Lists that exist as code, not rows. Only pages a visitor can reach from the
 * site's own navigation belong in the sitemap: search results are per-date and
 * noindex, and the /search/route, /search/location and /zones landing pages are
 * not linked from anywhere, so none of them is listed.
 */
const STATIC_PATHS: { path: string; changeFrequency: Entry['changeFrequency']; priority: number }[] = [
  { path: '/routes', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/reviews', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
]

/** System pages behind a sign-in; a crawler only ever sees the login redirect. */
const UNLISTED_PAGES = new Set(['/become-vendor'])

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
  const [pages, hidden, posts, categories] = await Promise.all([
    db.from('pages').select('id, slug, updated_at').eq('status', 'published'),
    db.from('seo_meta').select('entity_id').eq('entity_type', 'page').eq('noindex', true),
    db.from('blog_posts').select('slug, updated_at').eq('status', 'published'),
    db.from('blog_categories').select('slug, updated_at').eq('is_active', true),
  ])

  logError('pages', pages.error)
  logError('seo_meta', hidden.error)
  logError('blog_posts', posts.error)
  logError('blog_categories', categories.error)

  const hiddenIds = new Set((hidden.data ?? []).map((row) => row.entity_id))

  return [
    ...(pages.data ?? [])
      .filter((page) => !hiddenIds.has(page.id) && !UNLISTED_PAGES.has(page.slug))
      .map((page) =>
        page.slug === '/'
          ? entry('', page.updated_at, 'weekly', 1)
          : entry(page.slug, page.updated_at, 'monthly', 0.5)
      ),
    ...STATIC_PATHS.map((s) => entry(s.path, null, s.changeFrequency, s.priority)),
    ...(posts.data ?? []).map((post) => entry(`/blog/${post.slug}`, post.updated_at, 'monthly', 0.6)),
    ...(categories.data ?? []).map((c) => entry(`/blog/category/${c.slug}`, c.updated_at, 'weekly', 0.4)),
  ]
}

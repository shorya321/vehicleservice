import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Tables } from '@/lib/supabase/types'
import { PAGES_TAG, pageTag, type CmsPage, type PageKind, type PageStatus, type PageTemplate } from './types'
import { parseHomeContent } from './templates/home/parse'
import type { HomeContent } from './templates/home/schema'

const REVALIDATE_SECONDS = 3600

export function toCmsPage(row: Tables<'pages'>): CmsPage {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind as PageKind,
    template: row.template as PageTemplate,
    title: row.title,
    status: row.status as PageStatus,
    content: row.content,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

async function fetchPublishedPage(slug: string): Promise<CmsPage | null> {
  try {
    const { data, error } = await createAdminClient()
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      console.error(`[cms] Failed to load page ${slug}:`, error.message)
      return null
    }

    return data ? toCmsPage(data) : null
  } catch (error: unknown) {
    console.error(`[cms] Unexpected error loading page ${slug}:`, error)
    return null
  }
}

/**
 * A published page by its URL path. Null on a miss or a database error, so a
 * caller can always fall back to the shipped default copy.
 */
export async function getPublishedPage(slug: string): Promise<CmsPage | null> {
  const cached = unstable_cache(() => fetchPublishedPage(slug), ['cms-page', slug, 'v1'], {
    revalidate: REVALIDATE_SECONDS,
    tags: [PAGES_TAG, pageTag(slug)],
  })
  return cached()
}

/**
 * Home content, normalised after the cache rather than inside it: an entry
 * cached by an older build can outlive a deploy, and parsing on the way out
 * gives any field it lacks the current default.
 */
export async function getHomeContent(): Promise<{ page: CmsPage | null; content: HomeContent }> {
  const page = await getPublishedPage('/')
  return { page, content: parseHomeContent(page?.content) }
}

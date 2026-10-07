import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  DEFAULT_SEO_SETTINGS,
  EMPTY_SEO_META,
  SEO_META_COLUMNS,
  SEO_META_TAG,
  SEO_SETTINGS_TAG,
  parseSeoSettings,
  type SeoEntityType,
  type SeoMetaValues,
  type SeoSettings,
} from './types'

const REVALIDATE_SECONDS = 3600

const getCachedSeoSettings = unstable_cache(
  async (): Promise<unknown> => {
    try {
      const { data, error } = await createAdminClient()
        .from('seo_settings')
        .select('config')
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('[seo] Failed to load seo settings:', error.message)
        return null
      }
      return data?.config ?? null
    } catch (error: unknown) {
      console.error('[seo] Unexpected error loading seo settings:', error)
      return null
    }
  },
  ['seo-settings', 'v1'],
  { revalidate: REVALIDATE_SECONDS, tags: [SEO_SETTINGS_TAG] }
)

/** Site-wide SEO defaults, parsed after the cache so new keys get their defaults. */
export async function getSeoSettings(): Promise<SeoSettings> {
  const raw = await getCachedSeoSettings()
  return raw ? parseSeoSettings(raw) : DEFAULT_SEO_SETTINGS
}

export function rowToSeoMeta(row: {
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  og_title: string | null
  og_description: string | null
  og_image_url: string | null
  canonical_path: string | null
  noindex: boolean
  nofollow: boolean
}): SeoMetaValues {
  return {
    meta_title: row.meta_title ?? '',
    meta_description: row.meta_description ?? '',
    meta_keywords: row.meta_keywords ?? '',
    og_title: row.og_title ?? '',
    og_description: row.og_description ?? '',
    og_image_url: row.og_image_url ?? '',
    canonical_path: row.canonical_path ?? '',
    noindex: row.noindex,
    nofollow: row.nofollow,
  }
}

async function fetchSeoMeta(entityType: SeoEntityType, entityId: string): Promise<SeoMetaValues | null> {
  try {
    const { data, error } = await createAdminClient()
      .from('seo_meta')
      .select(SEO_META_COLUMNS)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .maybeSingle()

    if (error) {
      console.error(`[seo] Failed to load seo meta ${entityType}/${entityId}:`, error.message)
      return null
    }
    return data ? rowToSeoMeta(data) : null
  } catch (error: unknown) {
    console.error(`[seo] Unexpected error loading seo meta ${entityType}/${entityId}:`, error)
    return null
  }
}

/** SEO overrides for one entity, or empty values when none are set. */
export async function getSeoMeta(entityType: SeoEntityType, entityId: string): Promise<SeoMetaValues> {
  const cached = unstable_cache(
    () => fetchSeoMeta(entityType, entityId),
    // v2: rows gained keywords and social fields; a v1 entry would lack them.
    ['seo-meta', entityType, entityId, 'v2'],
    { revalidate: REVALIDATE_SECONDS, tags: [SEO_META_TAG, `${SEO_META_TAG}:${entityType}:${entityId}`] }
  )
  return (await cached()) ?? EMPTY_SEO_META
}

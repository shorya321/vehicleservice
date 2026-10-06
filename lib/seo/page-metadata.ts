import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site-settings/server'
import { getPublishedPage } from '@/lib/cms/server'
import { composeMetadata, type MetadataInput } from './build-metadata'
import { getSeoMeta, getSeoSettings } from './server'
import { EMPTY_SEO_META, type SeoEntityType } from './types'

type Fallbacks = Pick<MetadataInput, 'title' | 'description' | 'image' | 'type'>

interface EntityMetadataArgs extends Fallbacks {
  path: string
  entity?: { type: SeoEntityType; id: string }
}

/** Metadata for any public URL, merged from its SEO record and the site defaults. */
export async function buildEntityMetadata({ path, entity, ...fallbacks }: EntityMetadataArgs): Promise<Metadata> {
  const [settings, site, seo] = await Promise.all([
    getSeoSettings(),
    getSiteSettings(),
    entity ? getSeoMeta(entity.type, entity.id) : Promise.resolve(EMPTY_SEO_META),
  ])

  return composeMetadata({
    path,
    ...fallbacks,
    seo,
    settings,
    brandName: site.brand_name,
    blockIndexing: site.block_search_indexing,
  })
}

/**
 * Metadata for a page managed under Admin > Content > Pages. Its SEO record is
 * keyed by the `pages` row, found by slug; a page with no row yet still gets
 * the fallbacks.
 */
export async function buildPageMetadata(slug: string, fallbacks: Fallbacks = {}): Promise<Metadata> {
  const page = await getPublishedPage(slug)
  return buildEntityMetadata({
    path: slug,
    entity: page ? { type: 'page', id: page.id } : undefined,
    ...fallbacks,
  })
}

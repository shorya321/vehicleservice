import type { Metadata } from 'next'
import type { SeoMetaValues, SeoSettings } from './types'

export interface MetadataInput {
  /** The page's own URL path, used as the canonical unless overridden. */
  path: string
  /** Fallback title without the brand. Ignored when the admin set a meta title. */
  title?: string
  description?: string
  /** Fallback share image, e.g. a blog post's featured image. */
  image?: string | null
  type?: 'website' | 'article'
  seo: SeoMetaValues
  settings: SeoSettings
  brandName: string
  /** Site-wide pre-launch block from Settings > General. Always wins. */
  blockIndexing: boolean
}

export function titleSuffix(settings: SeoSettings, brandName: string): string {
  return settings.title_suffix || ` | ${brandName}`
}

/**
 * The full <title>. An admin meta title is used exactly as typed, since it is
 * what the snippet preview showed them. A fallback title gets the suffix once;
 * no title at all means the site default.
 */
export function resolveTitle(input: Pick<MetadataInput, 'title' | 'seo' | 'settings' | 'brandName'>): string {
  if (input.seo.meta_title) {
    return input.seo.meta_title
  }
  if (input.title) {
    return `${input.title}${titleSuffix(input.settings, input.brandName)}`
  }
  return input.settings.default_title
}

function resolveRobots(input: MetadataInput): Metadata['robots'] {
  if (input.blockIndexing) {
    return { index: false, follow: false }
  }
  if (input.seo.noindex || input.seo.nofollow) {
    return { index: !input.seo.noindex, follow: !input.seo.nofollow }
  }
  return undefined
}

/**
 * Builds a page's metadata from its SEO overrides and the site defaults. Pure,
 * so it is unit-tested; pages call it through `buildPageMetadata`.
 *
 * The title is always `absolute`: the root layout's template would otherwise
 * add the brand a second time to a title that already carries it.
 */
export function composeMetadata(input: MetadataInput): Metadata {
  const title = resolveTitle(input)
  const description = input.seo.meta_description || input.description || input.settings.default_description
  const canonical = input.seo.canonical_path || input.path
  const image = input.seo.og_image_url || input.image || input.settings.default_og_image_url
  const images = image ? [{ url: image }] : undefined
  const robots = resolveRobots(input)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: input.type ?? 'website',
      url: canonical,
      siteName: input.brandName,
      title,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(robots ? { robots } : {}),
  }
}

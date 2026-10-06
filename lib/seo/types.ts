import { z } from 'zod'

export const SEO_ENTITY_TYPES = ['page', 'blog_post', 'blog_category', 'route', 'zone', 'location'] as const
export type SeoEntityType = (typeof SEO_ENTITY_TYPES)[number]

/** Search engines truncate past these; the admin counters warn at them. */
export const META_TITLE_LIMIT = 60
export const META_DESCRIPTION_LIMIT = 160

export const SEO_SETTINGS_TAG = 'seo-settings'
export const SEO_META_TAG = 'seo-meta'

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('https://') || v.startsWith('/'), 'Use an https:// URL')

/** Site-wide defaults, stored as `seo_settings.config`. */
export const seoSettingsSchema = z.object({
  default_title: z.string().trim().min(1, 'Required').max(80),
  /** Appended to every page title except the home page's. Empty = " | {brand}". */
  title_suffix: z.string().max(40),
  default_description: z.string().trim().min(1, 'Required').max(META_DESCRIPTION_LIMIT * 2),
  default_og_image_url: optionalUrl,
  organization_logo_url: optionalUrl,
  google_verification: z.string().trim().max(120),
  bing_verification: z.string().trim().max(120),
})

export type SeoSettings = z.infer<typeof seoSettingsSchema>

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  default_title: 'Infinia Transfers | Airport & City Transfers, Fixed-Price',
  title_suffix: '',
  default_description:
    'Book private airport and city transfers with fixed pricing. Chauffeur at the gate, no surge fees.',
  default_og_image_url: '',
  organization_logo_url: '',
  google_verification: '',
  bing_verification: '',
}

export function parseSeoSettings(raw: unknown): SeoSettings {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_SEO_SETTINGS
  }
  const parsed = seoSettingsSchema.safeParse({ ...DEFAULT_SEO_SETTINGS, ...raw })
  return parsed.success ? parsed.data : DEFAULT_SEO_SETTINGS
}

/** Per-entity overrides, one `seo_meta` row. Empty strings mean "use the default". */
export const seoMetaSchema = z.object({
  meta_title: z.string().trim().max(120),
  meta_description: z.string().trim().max(320),
  og_image_url: optionalUrl,
  canonical_path: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === '' || v.startsWith('/') || v.startsWith('https://'), 'Use a path like /routes'),
  noindex: z.boolean(),
  nofollow: z.boolean(),
})

export type SeoMetaValues = z.infer<typeof seoMetaSchema>

export const EMPTY_SEO_META: SeoMetaValues = {
  meta_title: '',
  meta_description: '',
  og_image_url: '',
  canonical_path: '',
  noindex: false,
  nofollow: false,
}

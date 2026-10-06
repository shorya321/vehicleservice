export const PAGE_TEMPLATES = ['home', 'contact', 'terms', 'privacy', 'become-vendor', 'blocks'] as const
export type PageTemplate = (typeof PAGE_TEMPLATES)[number]

export type PageStatus = 'draft' | 'published'
export type PageKind = 'system' | 'custom'

export interface CmsPage {
  id: string
  slug: string
  kind: PageKind
  template: PageTemplate
  title: string
  status: PageStatus
  content: unknown
  publishedAt: string | null
  updatedAt: string
}

/** Cache tags. Every public read of page content is tagged with both. */
export const PAGES_TAG = 'pages'
export function pageTag(slug: string): string {
  return `page:${slug}`
}

/** Admin-facing names for the templates that have a content editor. */
export const TEMPLATE_LABELS: Readonly<Record<PageTemplate, string>> = {
  home: 'Home page',
  contact: 'Contact page',
  terms: 'Legal page',
  privacy: 'Legal page',
  'become-vendor': 'Partner page',
  blocks: 'Custom page',
}

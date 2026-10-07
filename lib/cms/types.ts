export const PAGE_TEMPLATES = ['home', 'contact', 'terms', 'privacy', 'vendor-agreement', 'become-vendor', 'blocks'] as const
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

/**
 * Whether a page offers Publish/Unpublish. Only where a draft really hides the
 * page: the vendor agreement 404s while a draft, as custom pages will. Home,
 * Terms, Privacy and Contact render their shipped copy whatever the status, so
 * a toggle there would only drop them from the sitemap.
 */
export function canChangePageStatus(page: { kind: PageKind; template: PageTemplate }): boolean {
  return page.kind === 'custom' || page.template === 'vendor-agreement'
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
  'vendor-agreement': 'Legal page',
  'become-vendor': 'Partner page',
  blocks: 'Custom page',
}

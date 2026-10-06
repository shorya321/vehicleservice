import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import type { SeoSettings } from './types'
import { absoluteUrl, getSiteUrl } from './site-url'

export type JsonLdObject = Record<string, unknown>

interface FaqEntry {
  question: string
  answer: string
}

/** The business behind the site, with the contact details the footer shows. */
export function organizationJsonLd(site: SiteSettingsConfig, seo: SeoSettings): JsonLdObject {
  const logo = seo.organization_logo_url || site.header_logo_url
  const sameAs = Object.values(site.social_links).filter((url) => url.trim() !== '')

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${getSiteUrl()}/#organization`,
    name: site.brand_name,
    url: getSiteUrl(),
    ...(logo ? { logo: absoluteUrl(logo) } : {}),
    ...(site.support_email ? { email: site.support_email } : {}),
    ...(site.support_phone ? { telephone: site.support_phone } : {}),
    ...(site.office_address ? { address: site.office_address } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

export function websiteJsonLd(site: SiteSettingsConfig): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${getSiteUrl()}/#website`,
    name: site.brand_name,
    url: getSiteUrl(),
    publisher: { '@id': `${getSiteUrl()}/#organization` },
  }
}

/**
 * Built from the same items the accordion renders, so the markup can never
 * claim a question the visitor cannot see.
 */
export function faqPageJsonLd(items: readonly FaqEntry[]): JsonLdObject | null {
  if (items.length === 0) {
    return null
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

/**
 * Serialised for a <script> body. `<` is escaped so a stored string holding
 * `</script>` cannot close the tag and inject markup.
 */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export interface BreadcrumbItem {
  name: string
  path: string
}

/** Home > Section > Page trail for rich results. */
export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

interface ArticleInput {
  title: string
  description: string
  path: string
  image: string | null
  publishedAt: string | null
  authorName: string | null
  publisherName: string
}

/** A blog post, credited to its author and published by the site. */
export function articleJsonLd(input: ArticleInput): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    ...(input.description ? { description: input.description } : {}),
    mainEntityOfPage: absoluteUrl(input.path),
    ...(input.image ? { image: [absoluteUrl(input.image)] } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    author: input.authorName
      ? { '@type': 'Person', name: input.authorName }
      : { '@type': 'Organization', name: input.publisherName },
    publisher: { '@id': `${getSiteUrl()}/#organization`, '@type': 'Organization', name: input.publisherName },
  }
}

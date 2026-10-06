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

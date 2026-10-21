import type { AboutContent } from '@/lib/cms/templates/about/schema'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import type { SeoSettings } from '@/lib/seo/types'
import { breadcrumbJsonLd, faqPageJsonLd, organizationJsonLd, type JsonLdObject } from '@/lib/seo/json-ld'
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url'

const PATH = '/about'

/**
 * AboutPage, the Organization it describes, the breadcrumb and the visible
 * FAQ. Legal name and founding date join the Organization only once the owner
 * has filled them in, so the markup never claims a fact the page hides.
 */
export function aboutJsonLd(content: AboutContent, site: SiteSettingsConfig, seo: SeoSettings): JsonLdObject[] {
  const { legalName, founded } = content.company
  const organization: JsonLdObject = {
    ...organizationJsonLd(site, seo),
    ...(legalName ? { legalName } : {}),
    ...(founded ? { foundingDate: founded } : {}),
    areaServed: { '@type': 'City', name: 'Dubai' },
  }
  const page: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${absoluteUrl(PATH)}#webpage`,
    url: absoluteUrl(PATH),
    name: `About ${site.brand_name}`,
    about: { '@id': `${getSiteUrl()}/#organization` },
    breadcrumb: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'About', path: PATH },
    ]),
  }
  const faq = content.faq.visible ? faqPageJsonLd(content.faq.items) : null

  return faq ? [page, organization, faq] : [page, organization]
}

import type { ServicesContent } from '@/lib/cms/templates/services/schema'
import { breadcrumbJsonLd, faqPageJsonLd, type JsonLdObject } from '@/lib/seo/json-ld'
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url'

const PATH = '/services'

/**
 * One Service per way to book, the breadcrumb and the visible FAQ. No offers
 * or prices: fares come from the search, never from markup.
 */
export function servicesJsonLd(content: ServicesContent): JsonLdObject[] {
  const provider = { '@id': `${getSiteUrl()}/#organization` }
  const areaServed = { '@type': 'City', name: 'Dubai' }

  const services: JsonLdObject[] = content.ways.items.map((item) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: item.title,
    serviceType: item.title,
    description: item.body,
    url: absoluteUrl(PATH),
    provider,
    areaServed,
  }))
  const page: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${absoluteUrl(PATH)}#webpage`,
    url: absoluteUrl(PATH),
    name: content.hero.accent ? `${content.hero.title} ${content.hero.accent}` : content.hero.title,
    breadcrumb: breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Services', path: PATH },
    ]),
  }
  const faq = content.faq.visible ? faqPageJsonLd(content.faq.items) : null

  return faq ? [page, ...services, faq] : [page, ...services]
}

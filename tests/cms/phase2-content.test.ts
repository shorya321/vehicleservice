/**
 * Contact and legal page content: shipped defaults must validate, bad rows
 * must fall back, and the contact details must come out of Settings exactly
 * as the page printed them when they were hardcoded.
 *
 * `lib/cms/sanitize.ts` is not covered here: isomorphic-dompurify pulls in
 * jsdom's ESM build, which this ts-jest setup cannot load. It is the same call
 * the blog post page already relies on.
 */
import { DEFAULT_CONTACT_CONTENT } from '@/lib/cms/templates/contact/defaults'
import { parseContactContent } from '@/lib/cms/templates/contact/parse'
import { contactContentSchema } from '@/lib/cms/templates/contact/schema'
import { contactDetailsFrom } from '@/lib/cms/templates/contact/details'
import { DEFAULT_TERMS_CONTENT } from '@/lib/cms/templates/legal/terms-defaults'
import { DEFAULT_PRIVACY_CONTENT } from '@/lib/cms/templates/legal/privacy-defaults'
import { parseLegalContent } from '@/lib/cms/templates/legal/parse'
import { legalContentSchema, toAnchor } from '@/lib/cms/templates/legal/schema'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'
import { listCanonical } from '@/lib/seo/list-canonical'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/json-ld'

const BANNED = /[–—…‘’“”]/

describe('contact content', () => {
  it('ships valid defaults without banned punctuation', () => {
    expect(contactContentSchema.safeParse(DEFAULT_CONTACT_CONTENT).success).toBe(true)
    expect(JSON.stringify(DEFAULT_CONTACT_CONTENT)).not.toMatch(BANNED)
  })

  it('falls back per section', () => {
    const faq = { ...DEFAULT_CONTACT_CONTENT.faq, title: 'Edited' }
    const result = parseContactContent({ hero: { title: '' }, faq })
    expect(result.hero).toEqual(DEFAULT_CONTACT_CONTENT.hero)
    expect(result.faq.title).toBe('Edited')
    expect(parseContactContent(null)).toEqual(DEFAULT_CONTACT_CONTENT)
  })

  it('reads email, phone and office from site settings', () => {
    expect(contactDetailsFrom(DEFAULT_SITE_SETTINGS)).toEqual({
      email: 'info@infiniatransfers.com',
      phone: '+971 50 123 4567',
      phoneHref: 'tel:+971501234567',
      officeLines: ['Business Bay, Dubai', 'United Arab Emirates'],
    })
  })

  it('falls back to the support email and copes with a one-part address', () => {
    const details = contactDetailsFrom({ ...DEFAULT_SITE_SETTINGS, info_email: '', office_address: 'Dubai' })
    expect(details.email).toBe('support@infiniatransfers.com')
    expect(details.officeLines).toEqual(['Dubai'])
  })
})

describe('legal content', () => {
  it.each([
    ['terms', DEFAULT_TERMS_CONTENT, 14],
    ['privacy', DEFAULT_PRIVACY_CONTENT, 12],
  ])('%s ships valid defaults with every section', (_name, content, count) => {
    expect(legalContentSchema.safeParse(content).success).toBe(true)
    expect(content.sections).toHaveLength(count)
    expect(JSON.stringify(content)).not.toMatch(BANNED)
  })

  it('keeps the anchors other pages link to', () => {
    expect(DEFAULT_TERMS_CONTENT.sections.map((s) => s.id)).toContain('cancellation-and-refund')
  })

  it('falls back whole on an invalid or empty row', () => {
    expect(parseLegalContent({}, DEFAULT_TERMS_CONTENT)).toBe(DEFAULT_TERMS_CONTENT)
    expect(parseLegalContent({ sections: [] }, DEFAULT_TERMS_CONTENT)).toBe(DEFAULT_TERMS_CONTENT)
  })

  it('rejects two sections with the same anchor', () => {
    const [first] = DEFAULT_TERMS_CONTENT.sections
    const content = { ...DEFAULT_TERMS_CONTENT, sections: [first, { ...first, title: 'Copy' }] }
    expect(legalContentSchema.safeParse(content).success).toBe(false)
  })

  it('builds anchors from headings', () => {
    expect(toAnchor('Cancellation & Refund Policy')).toBe('cancellation-refund-policy')
    expect(toAnchor("  Children's Privacy ")).toBe('children-s-privacy')
  })
})

describe('SEO helpers', () => {
  it('canonicalises list pages', () => {
    expect(listCanonical('/blog', undefined)).toBe('/blog')
    expect(listCanonical('/blog', '1')).toBe('/blog')
    expect(listCanonical('/blog', '3')).toBe('/blog?page=3')
    expect(listCanonical('/blog', 'abc')).toBe('/blog')
  })

  it('builds Article and Breadcrumb data', () => {
    const article = articleJsonLd({
      title: 'T',
      description: 'D',
      path: '/blog/t',
      image: null,
      publishedAt: '2026-01-01',
      authorName: null,
      publisherName: 'Infinia Transfers',
    })
    expect(article).toMatchObject({ '@type': 'BlogPosting', headline: 'T', author: { '@type': 'Organization' } })
    const crumbs = breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])
    expect(crumbs).toMatchObject({ itemListElement: [{ position: 1 }, { position: 2, name: 'Blog' }] })
  })
})

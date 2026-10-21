/**
 * About page structured data: AboutPage + Organization always, FAQPage only
 * while the FAQ section shows, and owner facts only once they are filled in.
 */
import { aboutJsonLd } from '@/app/about/about-json-ld'
import { DEFAULT_ABOUT_CONTENT } from '@/lib/cms/templates/about/defaults'
import { DEFAULT_SITE_SETTINGS } from '@/lib/site-settings/types'
import type { SeoSettings } from '@/lib/seo/types'

const seo = { organization_logo_url: '' } as SeoSettings

describe('aboutJsonLd', () => {
  it('emits AboutPage, Organization and FAQPage by default', () => {
    const types = aboutJsonLd(DEFAULT_ABOUT_CONTENT, DEFAULT_SITE_SETTINGS, seo).map((item) => item['@type'])
    expect(types).toEqual(['AboutPage', 'Organization', 'FAQPage'])
  })

  it('leaves out legal name and founding date while blank', () => {
    const [, organization] = aboutJsonLd(DEFAULT_ABOUT_CONTENT, DEFAULT_SITE_SETTINGS, seo)
    expect(organization).not.toHaveProperty('legalName')
    expect(organization).not.toHaveProperty('foundingDate')
  })

  it('adds legal name and founding date once filled in', () => {
    const content = {
      ...DEFAULT_ABOUT_CONTENT,
      company: { ...DEFAULT_ABOUT_CONTENT.company, legalName: 'Infinia Transfers L.L.C', founded: '2024' },
    }
    const [, organization] = aboutJsonLd(content, DEFAULT_SITE_SETTINGS, seo)
    expect(organization).toMatchObject({ legalName: 'Infinia Transfers L.L.C', foundingDate: '2024' })
  })

  it('drops FAQPage when the FAQ section is hidden', () => {
    const content = { ...DEFAULT_ABOUT_CONTENT, faq: { ...DEFAULT_ABOUT_CONTENT.faq, visible: false } }
    const types = aboutJsonLd(content, DEFAULT_SITE_SETTINGS, seo).map((item) => item['@type'])
    expect(types).toEqual(['AboutPage', 'Organization'])
  })
})

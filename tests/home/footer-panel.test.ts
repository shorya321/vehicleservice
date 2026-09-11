/**
 * The site footer body. Pins the outlined guarantee cards, the contact hrefs,
 * the legal links and the social filter, which must skip platforms that have
 * a URL but no icon.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { FooterPanel } from '@/components/layout/footer-panel'
import { FOOTER_GUARANTEES } from '@/components/layout/footer-data'
import { DEFAULT_SITE_SETTINGS, DEFAULT_SOCIAL_LINKS } from '@/lib/site-settings/types'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'

const render = (overrides: Partial<SiteSettingsConfig> = {}): string =>
  renderToStaticMarkup(jsx(FooterPanel, { settings: { ...DEFAULT_SITE_SETTINGS, ...overrides } }))

/** Icon path data carries arbitrary characters, so drop it first. */
const withoutSvg = (html: string): string => html.replace(/<svg[\s\S]*?<\/svg>/g, '')

describe('FooterPanel', () => {
  it('renders one outlined card per guarantee', () => {
    const html = render()
    expect(html.match(/class="site-footer__card"/g)).toHaveLength(FOOTER_GUARANTEES.length)
    for (const item of FOOTER_GUARANTEES) {
      expect(html).toContain(item.label)
      expect(html).toContain(item.body)
    }
  })

  it('strips spaces from the tel: href', () => {
    expect(render({ support_phone: '+971 50 123 4567' })).toContain('href="tel:+971501234567"')
  })

  it('links the support email', () => {
    expect(render()).toContain(`href="mailto:${DEFAULT_SITE_SETTINGS.support_email}"`)
  })

  it('omits the address when none is set', () => {
    expect(render({ office_address: '' })).not.toContain('<address')
    expect(render({ office_address: 'Business Bay, Dubai' })).toContain('Business Bay, Dubai')
  })

  it('links Privacy and Terms', () => {
    const html = render()
    expect(html).toContain('href="/privacy"')
    expect(html).toContain('href="/terms"')
  })

  it('keeps hash links as plain anchors', () => {
    expect(render()).toContain('href="/#faq"')
  })

  it('renders no social list when no platform is set', () => {
    expect(render({ social_links: DEFAULT_SOCIAL_LINKS })).not.toContain('site-footer__social')
  })

  it('shows platforms with an icon and skips those without one', () => {
    const html = render({
      social_links: {
        ...DEFAULT_SOCIAL_LINKS,
        instagram: 'https://instagram.com/infinia',
        tiktok: 'https://tiktok.com/@infinia',
      },
    })
    expect(html).toContain('aria-label="Instagram"')
    expect(html).not.toContain('tiktok.com')
  })

  it('carries no em dash, en dash, ellipsis or curly quote', () => {
    expect(withoutSvg(render())).not.toMatch(/[–—…‘’“”]/)
  })
})

/**
 * The browser-tab icon of a business portal.
 *
 * White-label: a tenant without an upload gets its own initials in its own
 * colour, the same tile the sidebar shows, and never the platform icon. The
 * monogram is an SVG built from tenant-controlled text and colour, so both
 * are checked for markup that could break out of the document.
 */

import { businessFaviconIcons, monogramFaviconDataUri } from '@/lib/business/favicon'
import { DEFAULT_THEME_CONFIG } from '@/lib/business/branding-utils'

const decode = (uri: string): string => decodeURIComponent(uri.replace('data:image/svg+xml,', ''))

describe('businessFaviconIcons', () => {
  it('uses the upload for the tab and the home-screen icon', () => {
    const icons = businessFaviconIcons({ faviconUrl: 'https://x/f.png', businessName: 'Acme Hotel', primaryColor: '#123456' })
    expect(icons).toEqual({ icon: [{ url: 'https://x/f.png' }], apple: 'https://x/f.png' })
  })

  it('falls back to a monogram with no upload', () => {
    const icons = businessFaviconIcons({ faviconUrl: null, businessName: 'Acme Hotel', primaryColor: '#123456' })
    expect(icons.icon[0].url.startsWith('data:image/svg+xml,')).toBe(true)
    expect(icons.icon[0].type).toBe('image/svg+xml')
    expect(icons.apple).toBeUndefined()
  })

  it('never points at the platform icon', () => {
    const icons = businessFaviconIcons({ faviconUrl: null, businessName: 'Acme Hotel', primaryColor: '#123456' })
    expect(JSON.stringify(icons)).not.toContain('/brand/')
  })
})

describe('monogramFaviconDataUri', () => {
  it('shows the same initials as the sidebar tile', () => {
    expect(decode(monogramFaviconDataUri('Acme Hotel', '#123456'))).toContain('>AH</text>')
    expect(decode(monogramFaviconDataUri('TransferCo', '#123456'))).toContain('>TR</text>')
  })

  it('fills with the tenant primary colour', () => {
    expect(decode(monogramFaviconDataUri('Acme Hotel', '#123456'))).toContain('fill="#123456"')
  })

  it('falls back to the default primary for a colour that is not a hex', () => {
    const svg = decode(monogramFaviconDataUri('Acme', 'red" onload="alert(1)'))
    expect(svg).toContain(`fill="${DEFAULT_THEME_CONFIG.accent.primary}"`)
    expect(svg).not.toContain('onload')
  })

  it('escapes markup in the business name', () => {
    const svg = decode(monogramFaviconDataUri('<s &x', '#123456'))
    expect(svg).toContain('&lt;')
    expect(svg).toContain('&amp;')
    expect(svg).not.toMatch(/<s[ >]/)
  })
})

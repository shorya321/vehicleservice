/**
 * Which logo file each theme shows, per slot.
 *
 * The failure mode is a logo that vanishes: a purple wordmark on the dark
 * theme, or a white one on the light theme. So an upload for one theme only
 * must still fill the other (the admin's own artwork beats ours), and no
 * upload at all must fall back to the bundled Infinia artwork.
 */

import { parseSiteSettings } from '@/lib/site-settings/types'
import { resolveSiteLogo, BUILT_IN_LOGOS } from '@/lib/site-settings/logo'

const settings = (raw: Record<string, unknown>) => parseSiteSettings(raw)

describe('reading the dark logo keys out of a stored config', () => {
  it('defaults both to null when absent, which is the live row today', () => {
    const parsed = settings({ brand_name: 'Infinia Transfers' })
    expect(parsed.header_logo_dark_url).toBeNull()
    expect(parsed.footer_logo_dark_url).toBeNull()
  })

  it('keeps a stored string', () => {
    const parsed = settings({ header_logo_dark_url: 'https://x/h.png', footer_logo_dark_url: 'https://x/f.png' })
    expect(parsed.header_logo_dark_url).toBe('https://x/h.png')
    expect(parsed.footer_logo_dark_url).toBe('https://x/f.png')
  })

  it('drops a non-string', () => {
    expect(settings({ header_logo_dark_url: 42 }).header_logo_dark_url).toBeNull()
  })
})

describe('resolveSiteLogo', () => {
  it('uses the bundled horizontal artwork for the header when nothing is uploaded', () => {
    const logo = resolveSiteLogo(settings({}), 'header')
    expect(logo.custom).toBe(false)
    expect(logo.light).toBe(BUILT_IN_LOGOS.horizontal.light)
    expect(logo.dark).toBe(BUILT_IN_LOGOS.horizontal.dark)
  })

  it('uses the bundled stacked artwork for the footer when nothing is uploaded', () => {
    const logo = resolveSiteLogo(settings({}), 'footer')
    expect(logo.custom).toBe(false)
    expect(logo.light).toBe(BUILT_IN_LOGOS.stacked.light)
    expect(logo.dark).toBe(BUILT_IN_LOGOS.stacked.dark)
  })

  it('uses both uploads when both are set', () => {
    const logo = resolveSiteLogo(
      settings({ header_logo_url: 'https://x/light.png', header_logo_dark_url: 'https://x/dark.png' }),
      'header'
    )
    expect(logo).toMatchObject({ custom: true, light: 'https://x/light.png', dark: 'https://x/dark.png' })
  })

  it('shows a light-only upload in dark mode too, as before dark uploads existed', () => {
    const logo = resolveSiteLogo(settings({ header_logo_url: 'https://x/light.png' }), 'header')
    expect(logo).toMatchObject({ custom: true, light: 'https://x/light.png', dark: 'https://x/light.png' })
  })

  it('shows a dark-only upload in light mode too', () => {
    const logo = resolveSiteLogo(settings({ footer_logo_dark_url: 'https://x/dark.png' }), 'footer')
    expect(logo).toMatchObject({ custom: true, light: 'https://x/dark.png', dark: 'https://x/dark.png' })
  })

  it('keeps the slots independent', () => {
    const logo = resolveSiteLogo(settings({ header_logo_url: 'https://x/h.png' }), 'footer')
    expect(logo.custom).toBe(false)
  })
})

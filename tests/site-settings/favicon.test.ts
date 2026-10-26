/**
 * The favicon links the root layout emits.
 *
 * No upload must still give every tab an icon (the bundled set), and an
 * upload must replace every size, or iOS keeps the old home-screen icon.
 */

import { parseSiteSettings } from '@/lib/site-settings/types'
import { faviconIcons, BUILT_IN_FAVICON } from '@/lib/site-settings/logo'

describe('reading favicon_url out of a stored config', () => {
  it('defaults to null when absent, which is the live row today', () => {
    expect(parseSiteSettings({ brand_name: 'Infinia Transfers' }).favicon_url).toBeNull()
  })

  it('keeps a stored string and drops a non-string', () => {
    expect(parseSiteSettings({ favicon_url: 'https://x/f.png' }).favicon_url).toBe('https://x/f.png')
    expect(parseSiteSettings({ favicon_url: 7 }).favicon_url).toBeNull()
  })
})

describe('faviconIcons', () => {
  it('links the bundled set when nothing is uploaded', () => {
    const icons = faviconIcons({ favicon_url: null })
    expect(icons.icon).toEqual([
      { url: BUILT_IN_FAVICON.icon32, sizes: '32x32', type: 'image/png' },
      { url: BUILT_IN_FAVICON.icon192, sizes: '192x192', type: 'image/png' },
    ])
    expect(icons.apple).toBe(BUILT_IN_FAVICON.apple)
  })

  it('uses the upload for the tab and the home-screen icon', () => {
    const icons = faviconIcons({ favicon_url: 'https://x/f.png' })
    expect(icons.icon).toEqual([{ url: 'https://x/f.png' }])
    expect(icons.apple).toBe('https://x/f.png')
  })
})

/**
 * Photo alt text on About steps, Services cards, the shared closing panel,
 * blog images and share images. Rows saved before the fields existed must
 * keep parsing as they did, and an alt only ever travels with its own photo.
 */
import { DEFAULT_ABOUT_CONTENT } from '@/lib/cms/templates/about/defaults'
import { parseAboutContent } from '@/lib/cms/templates/about/parse'
import { DEFAULT_SERVICES_CONTENT } from '@/lib/cms/templates/services/defaults'
import { parseServicesContent } from '@/lib/cms/templates/services/parse'
import { DEFAULT_CLOSING_PANEL } from '@/lib/cms/blocks/closing-panel/defaults'
import { parseClosingPanel } from '@/lib/cms/blocks/closing-panel/parse'
import { withItemAlts } from '@/lib/cms/item-alts'
import { IMAGE_ALT_MAX, normaliseImageAlt } from '@/lib/blog/image-alt'
import { composeMetadata, type MetadataInput } from '@/lib/seo/build-metadata'
import { DEFAULT_SEO_SETTINGS, EMPTY_SEO_META } from '@/lib/seo/types'

/** Items as stored before alt text existed. */
function withoutAlts<T extends { alt: string }>(items: T[]): Omit<T, 'alt'>[] {
  return items.map(({ alt: _alt, ...rest }) => rest)
}

describe('CMS list item alt text', () => {
  it('ships an alt for every default step and service card', () => {
    for (const item of [...DEFAULT_ABOUT_CONTENT.steps.items, ...DEFAULT_SERVICES_CONTENT.ways.items]) {
      expect(item.alt.length).toBeGreaterThan(0)
    }
  })

  it('keeps a saved About steps edit that predates alt text', () => {
    const items = withoutAlts(DEFAULT_ABOUT_CONTENT.steps.items).map((item) => ({ ...item, title: 'Edited.' }))
    const result = parseAboutContent({ steps: { ...DEFAULT_ABOUT_CONTENT.steps, items } })
    expect(result.steps.items.map((item) => item.title)).toEqual(['Edited.', 'Edited.', 'Edited.'])
    expect(result.steps.items.map((item) => item.alt)).toEqual(['', '', ''])
  })

  it('keeps a saved Services ways edit that predates alt text', () => {
    const items = withoutAlts(DEFAULT_SERVICES_CONTENT.ways.items).map((item) => ({ ...item, title: 'Edited' }))
    const result = parseServicesContent({ ways: { ...DEFAULT_SERVICES_CONTENT.ways, items } })
    expect(result.ways.items.every((item) => item.title === 'Edited' && item.alt === '')).toBe(true)
  })

  it('keeps a saved alt', () => {
    const items = DEFAULT_SERVICES_CONTENT.ways.items.map((item) => ({ ...item, alt: 'A car at the kerb' }))
    const result = parseServicesContent({ ways: { ...DEFAULT_SERVICES_CONTENT.ways, items } })
    expect(result.ways.items[0].alt).toBe('A car at the kerb')
  })

  it('still falls back when an alt is too long', () => {
    const items = DEFAULT_ABOUT_CONTENT.steps.items.map((item) => ({ ...item, alt: 'x'.repeat(141) }))
    const result = parseAboutContent({ steps: { ...DEFAULT_ABOUT_CONTENT.steps, items } })
    expect(result.steps).toEqual(DEFAULT_ABOUT_CONTENT.steps)
  })

  it('passes sections without items through untouched', () => {
    const section = { title: 'Same' }
    expect(withItemAlts(section)).toBe(section)
  })
})

describe('closing panel alt text', () => {
  it('pairs the default alts with the default photos', () => {
    expect(parseClosingPanel({}).imageAlts).toEqual(DEFAULT_CLOSING_PANEL.imageAlts)
  })

  it('never gives uploaded photos the default descriptions', () => {
    const result = parseClosingPanel({ images: ['/a.jpg', '/b.jpg'] })
    expect(result.images).toEqual(['/a.jpg', '/b.jpg'])
    expect(result.imageAlts).toEqual(['', ''])
  })

  it('keeps saved alts', () => {
    const result = parseClosingPanel({ images: ['/a.jpg', '/b.jpg'], imageAlts: ['First', 'Second'] })
    expect(result.imageAlts).toEqual(['First', 'Second'])
  })
})

describe('normaliseImageAlt', () => {
  it('trims and stores the text with an image', () => {
    expect(normaliseImageAlt('  A car  ', '/a.jpg')).toBe('A car')
  })

  it('stores null when empty or when there is no image', () => {
    expect(normaliseImageAlt('', '/a.jpg')).toBeNull()
    expect(normaliseImageAlt(undefined, '/a.jpg')).toBeNull()
    expect(normaliseImageAlt('A car', null)).toBeNull()
  })

  it('rejects text over the limit', () => {
    expect(() => normaliseImageAlt('x'.repeat(IMAGE_ALT_MAX + 1), '/a.jpg')).toThrow()
  })
})

describe('share image alt text', () => {
  const base: MetadataInput = {
    path: '/blog/post',
    title: 'Post',
    seo: EMPTY_SEO_META,
    settings: { ...DEFAULT_SEO_SETTINGS, default_og_image_url: '/default.jpg' },
    brandName: 'Infinia Transfers',
    blockIndexing: false,
  }

  it('uses the SEO share image alt with the SEO share image', () => {
    const seo = { ...EMPTY_SEO_META, og_image_url: '/share.jpg', og_image_alt: 'Share' }
    const meta = composeMetadata({ ...base, seo, image: '/own.jpg', imageAlt: 'Own' })
    expect(meta.openGraph?.images).toEqual([{ url: '/share.jpg', alt: 'Share' }])
  })

  it('uses the page image alt with the page image', () => {
    const meta = composeMetadata({ ...base, image: '/own.jpg', imageAlt: 'Own' })
    expect(meta.openGraph?.images).toEqual([{ url: '/own.jpg', alt: 'Own' }])
  })

  it('gives the site default image no alt', () => {
    expect(composeMetadata({ ...base, imageAlt: 'Own' }).openGraph?.images).toEqual([{ url: '/default.jpg' }])
  })

  it('omits an empty alt', () => {
    expect(composeMetadata({ ...base, image: '/own.jpg' }).openGraph?.images).toEqual([{ url: '/own.jpg' }])
  })
})

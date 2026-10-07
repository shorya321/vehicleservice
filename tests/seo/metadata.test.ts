/**
 * Page metadata built from admin SEO fields and site defaults. Pins the title
 * rule (brand exactly once), the canonical, and that the site-wide indexing
 * block always beats a page's own robots choice.
 */
import { composeMetadata, type MetadataInput } from '@/lib/seo/build-metadata'
import { faqPageJsonLd, serializeJsonLd } from '@/lib/seo/json-ld'
import { DEFAULT_SEO_SETTINGS, EMPTY_SEO_META } from '@/lib/seo/types'

const base: MetadataInput = {
  path: '/contact',
  title: 'Contact Us',
  description: 'Fallback description',
  seo: EMPTY_SEO_META,
  settings: DEFAULT_SEO_SETTINGS,
  brandName: 'Infinia Transfers',
  blockIndexing: false,
}

describe('composeMetadata', () => {
  it('adds the brand to a fallback title once', () => {
    expect(composeMetadata(base).title).toEqual({ absolute: 'Contact Us | Infinia Transfers' })
  })

  it('uses an admin meta title exactly as typed', () => {
    const seo = { ...EMPTY_SEO_META, meta_title: 'Talk to us | Infinia' }
    expect(composeMetadata({ ...base, seo }).title).toEqual({ absolute: 'Talk to us | Infinia' })
  })

  it('uses the site default title when the page has none (home)', () => {
    expect(composeMetadata({ ...base, path: '/', title: undefined }).title).toEqual({
      absolute: DEFAULT_SEO_SETTINGS.default_title,
    })
  })

  it('honours a custom title suffix', () => {
    const settings = { ...DEFAULT_SEO_SETTINGS, title_suffix: ' - Infinia' }
    expect(composeMetadata({ ...base, settings }).title).toEqual({ absolute: 'Contact Us - Infinia' })
  })

  it('sets the canonical to the page path unless overridden', () => {
    expect(composeMetadata(base).alternates).toEqual({ canonical: '/contact' })
    const seo = { ...EMPTY_SEO_META, canonical_path: '/support' }
    expect(composeMetadata({ ...base, seo }).alternates).toEqual({ canonical: '/support' })
  })

  it('prefers the admin description over the fallback', () => {
    const seo = { ...EMPTY_SEO_META, meta_description: 'Admin description' }
    expect(composeMetadata({ ...base, seo }).description).toBe('Admin description')
    expect(composeMetadata(base).description).toBe('Fallback description')
  })

  it('picks the share image: page, then fallback, then site default', () => {
    const settings = { ...DEFAULT_SEO_SETTINGS, default_og_image_url: 'https://x/default.jpg' }
    expect(composeMetadata({ ...base, settings }).openGraph?.images).toEqual([{ url: 'https://x/default.jpg' }])
    expect(composeMetadata({ ...base, settings, image: 'https://x/post.jpg' }).openGraph?.images).toEqual([
      { url: 'https://x/post.jpg' },
    ])
    const seo = { ...EMPTY_SEO_META, og_image_url: 'https://x/page.jpg' }
    expect(composeMetadata({ ...base, settings, seo }).openGraph?.images).toEqual([{ url: 'https://x/page.jpg' }])
  })

  it('omits robots for an indexable page so the layout default stands', () => {
    expect(composeMetadata(base).robots).toBeUndefined()
  })

  it('applies a page noindex', () => {
    const seo = { ...EMPTY_SEO_META, noindex: true }
    expect(composeMetadata({ ...base, seo }).robots).toEqual({ index: false, follow: true })
  })

  it('lets the site-wide block win over everything', () => {
    expect(composeMetadata({ ...base, blockIndexing: true }).robots).toEqual({ index: false, follow: false })
  })

  it('emits keywords as a trimmed list, and none when empty', () => {
    expect(composeMetadata(base).keywords).toBeUndefined()
    const seo = { ...EMPTY_SEO_META, meta_keywords: ' dubai transfer, airport taxi ,, chauffeur ' }
    expect(composeMetadata({ ...base, seo }).keywords).toEqual(['dubai transfer', 'airport taxi', 'chauffeur'])
  })

  it('gives social cards their own title and description when set', () => {
    const seo = { ...EMPTY_SEO_META, og_title: 'Share title', og_description: 'Share description' }
    const metadata = composeMetadata({ ...base, seo })
    expect(metadata.title).toEqual({ absolute: 'Contact Us | Infinia Transfers' })
    expect(metadata.description).toBe('Fallback description')
    expect(metadata.openGraph).toMatchObject({ title: 'Share title', description: 'Share description' })
    expect(metadata.twitter).toMatchObject({ title: 'Share title', description: 'Share description' })
  })

  it('falls back to the search title and description for social cards', () => {
    const metadata = composeMetadata(base)
    expect(metadata.openGraph).toMatchObject({
      title: 'Contact Us | Infinia Transfers',
      description: 'Fallback description',
    })
  })
})

describe('JSON-LD', () => {
  it('builds FAQPage from the visible items', () => {
    const data = faqPageJsonLd([{ question: 'Q?', answer: 'A.' }])
    expect(data).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }],
    })
    expect(faqPageJsonLd([])).toBeNull()
  })

  it('cannot be closed early by stored text', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })
})

/**
 * Stored home content is admin input read back from JSON. These pin that a bad
 * or partial row never blanks the page: each section falls back on its own.
 */
import { DEFAULT_HOME_CONTENT } from '@/lib/cms/templates/home/defaults'
import { parseHomeContent } from '@/lib/cms/templates/home/parse'
import { homeContentSchema } from '@/lib/cms/templates/home/schema'
import { collectCmsImageUrls, removedCmsImages } from '@/lib/cms/images'

const STORAGE = 'https://example.supabase.co/storage/v1/object/public/vehicles'

describe('DEFAULT_HOME_CONTENT', () => {
  it('passes its own schema, so an empty row renders the shipped page', () => {
    expect(homeContentSchema.safeParse(DEFAULT_HOME_CONTENT).success).toBe(true)
  })

  it('carries no em dash, en dash, ellipsis or curly quote', () => {
    expect(JSON.stringify(DEFAULT_HOME_CONTENT)).not.toMatch(/[–—…‘’“”]/)
  })
})

describe('parseHomeContent', () => {
  it('returns the defaults for an empty or non-object row', () => {
    expect(parseHomeContent({})).toEqual(DEFAULT_HOME_CONTENT)
    expect(parseHomeContent(null)).toEqual(DEFAULT_HOME_CONTENT)
    expect(parseHomeContent('nope')).toEqual(DEFAULT_HOME_CONTENT)
  })

  it('applies a valid section edit', () => {
    const hero = { ...DEFAULT_HOME_CONTENT.hero, title: 'Airport transfers in Dubai.' }
    expect(parseHomeContent({ hero }).hero.title).toBe('Airport transfers in Dubai.')
  })

  it('falls back for one invalid section and keeps the others', () => {
    const faq = { ...DEFAULT_HOME_CONTENT.faq, title: 'Edited FAQ' }
    const result = parseHomeContent({ hero: { title: '' }, faq })
    expect(result.hero).toEqual(DEFAULT_HOME_CONTENT.hero)
    expect(result.faq.title).toBe('Edited FAQ')
  })

  it('fills a field added after the section was saved', () => {
    const { visible: _dropped, ...older } = DEFAULT_HOME_CONTENT.cities
    expect(parseHomeContent({ cities: older }).cities.visible).toBe(true)
  })

  it('rejects a list whose length the layout depends on', () => {
    const benefits = { ...DEFAULT_HOME_CONTENT.benefits, items: DEFAULT_HOME_CONTENT.benefits.items.slice(0, 2) }
    expect(parseHomeContent({ benefits }).benefits).toEqual(DEFAULT_HOME_CONTENT.benefits)
  })

  it('rejects a javascript: link', () => {
    const faq = { ...DEFAULT_HOME_CONTENT.faq, cta: { label: 'x', href: 'javascript:alert(1)' } }
    expect(parseHomeContent({ faq }).faq.cta.href).toBe('/contact')
  })
})

describe('CMS image cleanup', () => {
  const kept = `${STORAGE}/cms/a.webp`
  const dropped = `${STORAGE}/cms/b.webp`

  it('only collects uploads under the cms folder', () => {
    const content = { a: kept, b: [`${STORAGE}/blog/x.jpg`, '/images/cities/downtown.webp'], c: { d: dropped } }
    expect(collectCmsImageUrls(content).sort()).toEqual([kept, dropped])
  })

  it('reports uploads that a save removed', () => {
    expect(removedCmsImages({ x: kept, y: dropped }, { x: kept })).toEqual([dropped])
    expect(removedCmsImages(kept, kept)).toEqual([])
  })
})

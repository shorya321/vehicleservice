/**
 * The home "Questions travellers actually ask." panel. Pins the accordion's
 * ARIA wiring, the single-open state, and that closed answers are inert so
 * they leave the tab order while staying in the markup.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { FaqPanel } from '@/components/home/faq-panel'
import { FAQ_ITEMS } from '@/components/home/faq-data'

const render = (openIndex: number | null): string =>
  renderToStaticMarkup(jsx(FaqPanel, { openIndex, onToggle: () => {} }))

/** Icon path data carries arbitrary characters, so drop it first. */
const withoutSvg = (html: string): string => html.replace(/<svg[\s\S]*?<\/svg>/g, '')

const regionTags = (html: string): string[] => html.match(/<div[^>]*role="region"[^>]*>/g) ?? []

describe('FaqPanel', () => {
  it('labels the section heading for aria-labelledby', () => {
    expect(render(0)).toContain('id="faq-heading"')
  })

  it('links support to /contact', () => {
    expect(render(0)).toContain('href="/contact"')
  })

  it('renders one card per question', () => {
    const html = render(0)
    expect(FAQ_ITEMS).toHaveLength(6)
    expect(html.match(/class="faq-card"/g)).toHaveLength(FAQ_ITEMS.length)
  })

  it('expands only the open card', () => {
    const html = render(0)
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1)
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(FAQ_ITEMS.length - 1)
  })

  it('expands nothing when openIndex is null', () => {
    expect(render(null)).not.toContain('aria-expanded="true"')
  })

  it('points every trigger at a region that exists', () => {
    const html = render(0)
    // match() rather than matchAll(): the ES5 target downlevels an iterator
    // spread to an empty array.
    const controls = (html.match(/aria-controls="[^"]+"/g) ?? []).map((a) => a.slice(15, -1))
    expect(controls).toHaveLength(FAQ_ITEMS.length)
    for (const id of controls) {
      expect(html).toMatch(new RegExp(`<div[^>]*id="${id}"[^>]*role="region"`))
    }
  })

  it('makes closed answers inert and leaves the open one reachable', () => {
    const regions = regionTags(render(2))
    expect(regions).toHaveLength(FAQ_ITEMS.length)
    regions.forEach((tag, i) => {
      if (i === 2) expect(tag).not.toMatch(/\binert\b/)
      else expect(tag).toMatch(/\binert\b/)
    })
  })

  it('keeps every answer in the markup, open or closed', () => {
    const html = render(null)
    for (const item of FAQ_ITEMS) expect(html).toContain(item.question)
  })

  it('carries no em dash, en dash, ellipsis or curly quote', () => {
    expect(withoutSvg(render(0))).not.toMatch(/[–—…‘’“”]/)
  })
})

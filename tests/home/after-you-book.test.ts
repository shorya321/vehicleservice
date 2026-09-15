/**
 * The home "After you book" plate and its Dubai zone network. Pins the two
 * links, the heading id the section is labelled by, and that every zone lands
 * inside the drawing so no label is placed off the plate.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { AfterYouBookPlate } from '@/components/home/after-you-book/after-you-book-plate'
import { HUB, ZONES, arcPath, project } from '@/components/home/after-you-book/zone-geometry'

const render = (): string => renderToStaticMarkup(jsx(AfterYouBookPlate, {}))

const withoutSvg = (html: string): string => html.replace(/<svg[\s\S]*?<\/svg>/g, '')

describe('AfterYouBookPlate', () => {
  it('labels the section heading for aria-labelledby', () => {
    expect(render()).toContain('id="after-you-book-heading"')
  })

  it('sends Book a transfer to the hero search and Manage to account bookings', () => {
    const html = render()
    expect(html).toContain('href="#hero"')
    expect(html).toContain('href="/account?tab=bookings"')
  })

  it('draws one arc and one node label per zone', () => {
    const html = render()
    expect(html.match(/class="after-book-net__arc"/g)).toHaveLength(ZONES.length)
    for (const zone of ZONES) {
      expect(html).toContain(`>${zone.name.replace('&', '&amp;')}<`)
    }
  })

  it('carries no em dash, en dash, ellipsis or curly quote', () => {
    expect(withoutSvg(render())).not.toMatch(/[–—…‘’“”]/)
  })
})

describe('zone geometry', () => {
  it('projects the hub and every zone inside the 0 to 100 drawing', () => {
    for (const point of [HUB, ...ZONES]) {
      const { x, y } = project(point)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(100)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }
  })

  it('puts east to the right and north to the top', () => {
    const marina = ZONES.find((z) => z.name.startsWith('Dubai Marina'))
    expect(marina).toBeDefined()
    const m = project(marina!)
    const h = project(HUB)
    expect(m.x).toBeLessThan(h.x)
    expect(m.y).toBeGreaterThan(h.y)
  })

  it('starts every arc at the hub and ends at its zone', () => {
    const h = project(HUB)
    for (const zone of ZONES) {
      const z = project(zone)
      const d = arcPath(zone)
      expect(d.startsWith(`M${h.x.toFixed(2)},${h.y.toFixed(2)} Q`)).toBe(true)
      expect(d.endsWith(`${z.x.toFixed(2)},${z.y.toFixed(2)}`)).toBe(true)
    }
  })
})

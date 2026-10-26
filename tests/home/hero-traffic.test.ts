/**
 * The hero's night-traffic shader. Pins the screen-to-map transform (it must
 * match the SVG's `xMidYMid slice` or the light trails drift off the roads),
 * the theme token parsing, and that the map keeps its full fade for every
 * other page while home drops only the centre of it.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeroMap } from '@/components/home/hero/hero-map'
import { mapViewTransform, parseTrafficStyle } from '@/components/home/hero/traffic-shader'

describe('mapViewTransform', () => {
  it('scales by width and centres vertically when the box is wider than the map', () => {
    const t = mapViewTransform(3200, 1000)
    expect(t.scale).toBeCloseTo(2)
    expect(t.offsetX).toBeCloseTo(0)
    expect(t.offsetY).toBeCloseTo((1000 - 880 * 2) / 2)
  })

  it('scales by height and centres horizontally when the box is taller than the map', () => {
    const t = mapViewTransform(390, 880)
    expect(t.scale).toBeCloseTo(1)
    expect(t.offsetX).toBeCloseTo((390 - 1600) / 2)
    expect(t.offsetY).toBeCloseTo(0)
  })

  it('never returns a zero scale for an empty box', () => {
    expect(mapViewTransform(0, 0).scale).toBeGreaterThan(0)
  })
})

describe('parseTrafficStyle', () => {
  it('reads an rgb triplet and a strength', () => {
    const style = parseTrafficStyle(' 198, 170, 136', ' 0.2 ')
    expect(style).not.toBeNull()
    expect(style!.color[0]).toBeCloseTo(198 / 255)
    expect(style!.color[2]).toBeCloseTo(136 / 255)
    expect(style!.strength).toBeCloseTo(0.2)
  })

  it('returns null when a token is missing or malformed', () => {
    expect(parseTrafficStyle('', '0.2')).toBeNull()
    expect(parseTrafficStyle('198, 170', '0.2')).toBeNull()
    expect(parseTrafficStyle('198, 170, 136', 'bright')).toBeNull()
  })

  it('clamps strength to 0..1', () => {
    expect(parseTrafficStyle('1, 2, 3', '4')!.strength).toBe(1)
    expect(parseTrafficStyle('1, 2, 3', '-1')!.strength).toBe(0)
  })
})

describe('HeroMap fade', () => {
  it('keeps the full fade by default', () => {
    const html = renderToStaticMarkup(jsx(HeroMap, {}))
    expect(html).toContain('class="hero-map-fade absolute inset-0"')
  })

  it('drops only the centre fade when asked, and renders children under the fade', () => {
    const html = renderToStaticMarkup(jsx(HeroMap, { centreFade: false, children: jsx('canvas', { id: 'probe' }) }))
    expect(html).toContain('hero-map-fade hero-map-fade--edges')
    expect(html.indexOf('id="probe"')).toBeLessThan(html.indexOf('hero-map-fade'))
    expect(html.indexOf('</svg>')).toBeLessThan(html.indexOf('id="probe"'))
  })
})

/**
 * Night traffic on the search page's route band. The band crops the hero map
 * to its own viewBox, so the shader has to be told that window or the trails
 * leave the roads. Traffic is opt-in: RouteBandMap is shared with the
 * confirmation, account, hourly and multi-city pages, which keep the still map.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { RouteBandMap } from '@/app/search/results/components/route-band-map'
import { HERO_MAP_VIEW, mapViewTransform, parseViewBox } from '@/components/home/hero/traffic-shader'

describe('parseViewBox', () => {
  it('reads all four numbers', () => {
    expect(parseViewBox('120 157 1180 560')).toEqual({ x: 120, y: 157, width: 1180, height: 560 })
  })

  it('falls back to the hero view for a malformed box', () => {
    expect(parseViewBox('')).toEqual(HERO_MAP_VIEW)
    expect(parseViewBox('0 0 0 560')).toEqual(HERO_MAP_VIEW)
    expect(parseViewBox('a b c d')).toEqual(HERO_MAP_VIEW)
  })

  it('defaults to the hero map window', () => {
    expect(HERO_MAP_VIEW).toEqual({ x: 0, y: 20, width: 1600, height: 880 })
  })
})

describe('mapViewTransform with a cropped view', () => {
  it('uses the given window, the way the band SVG slices it', () => {
    const view = parseViewBox('120 157 1180 560')
    const t = mapViewTransform(1440, 447, view)
    expect(t.scale).toBeCloseTo(1440 / 1180)
    expect(t.offsetX).toBeCloseTo(0)
    expect(t.offsetY).toBeCloseTo((447 - 560 * (1440 / 1180)) / 2)
  })
})

describe('RouteBandMap traffic', () => {
  it('renders no traffic host by default', () => {
    const html = renderToStaticMarkup(jsx(RouteBandMap, {}))
    expect(html).not.toContain('hero-traffic-host')
  })

  it('puts the traffic host between the map and the fade when asked', () => {
    const html = renderToStaticMarkup(jsx(RouteBandMap, { traffic: true }))
    expect(html).toContain('hero-traffic-host')
    expect(html.indexOf('</svg>')).toBeLessThan(html.indexOf('hero-traffic-host'))
    expect(html.indexOf('hero-traffic-host')).toBeLessThan(html.indexOf('route-band__fade'))
  })
})

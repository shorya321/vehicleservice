/**
 * The hero stats under the search bar, drawn as glass chips. Pins the CMS data
 * flowing through unchanged (label as the term, value as the figure), the icon
 * picked per stat, and the classes the reveal animation and the dropdown
 * stacking rule depend on.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeroStats, statIconKind } from '@/components/home/hero/hero-stats'

const STATS = [
  { label: 'Dubai zones', value: '29', is_rating: false },
  { label: 'Free waiting', value: '60 min', is_rating: false },
  { label: 'Rating', value: '4.9', is_rating: true },
]

describe('statIconKind', () => {
  it('gives the rating a star whatever its label says', () => {
    expect(statIconKind({ label: 'Travellers say', value: '4.9', is_rating: true })).toBe('star')
  })

  it('gives waiting and time stats a clock', () => {
    expect(statIconKind({ label: 'Free waiting', value: '60 min', is_rating: false })).toBe('clock')
    expect(statIconKind({ label: 'Pickup time', value: '15', is_rating: false })).toBe('clock')
  })

  it('falls back to a pin for coverage and anything unknown', () => {
    expect(statIconKind({ label: 'Dubai zones', value: '29', is_rating: false })).toBe('pin')
    expect(statIconKind({ label: 'Vehicles', value: '120', is_rating: false })).toBe('pin')
  })
})

describe('HeroStats', () => {
  it('renders nothing when there are no stats', () => {
    expect(renderToStaticMarkup(jsx(HeroStats, { stats: [] }))).toBe('')
  })

  it('keeps the reveal and stacking classes on the list', () => {
    const html = renderToStaticMarkup(jsx(HeroStats, { stats: STATS }))
    expect(html).toMatch(/^<dl class="hero-reveal hero-reveal--stats hero-stats/)
  })

  it('renders each CMS label and value, term before figure', () => {
    const html = renderToStaticMarkup(jsx(HeroStats, { stats: STATS }))
    for (const stat of STATS) {
      const term = html.indexOf(`<dt class="hero-stats-label">${stat.label}</dt>`)
      const figure = html.indexOf(`${stat.value}</span></dd>`)
      expect(term).toBeGreaterThan(-1)
      expect(figure).toBeGreaterThan(term)
    }
  })

  it('draws one decorative icon per stat', () => {
    const html = renderToStaticMarkup(jsx(HeroStats, { stats: STATS }))
    expect(html.match(/class="hero-stats-icon" aria-hidden="true"/g)).toHaveLength(3)
  })
})

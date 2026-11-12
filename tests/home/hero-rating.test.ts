/**
 * The hero's "Star rating" stat reads the live average of approved reviews. The
 * value typed in Admin > Pages > Home is ignored for it, so the hero can never
 * claim a figure the reviews do not support.
 */
import { resolveHeroStats } from '@/components/home/hero/hero-stats'

const STATS = [
  { label: 'Dubai zones', value: '29', is_rating: false },
  { label: 'Free waiting', value: '60 min', is_rating: false },
  { label: 'Rating', value: '4.9', is_rating: true },
]

describe('resolveHeroStats', () => {
  it('drops the rating stat while there are no approved reviews', () => {
    const out = resolveHeroStats(STATS, { count: 0, average: 0 })
    expect(out.map((s) => s.label)).toEqual(['Dubai zones', 'Free waiting'])
  })

  it('shows the live average, one decimal, in place of the typed value', () => {
    const out = resolveHeroStats(STATS, { count: 3, average: 4.333 })
    expect(out[2]).toEqual({ label: 'Rating', value: '4.3', is_rating: true })
  })

  it('leaves every other stat exactly as the admin typed it', () => {
    const out = resolveHeroStats(STATS, { count: 3, average: 4.333 })
    expect(out.slice(0, 2)).toEqual(STATS.slice(0, 2))
  })

  it('does not mutate the CMS content it was given', () => {
    const copy = JSON.parse(JSON.stringify(STATS))
    resolveHeroStats(STATS, { count: 3, average: 4.333 })
    expect(STATS).toEqual(copy)
  })

  it('keeps a whole-number average readable as a rating', () => {
    expect(resolveHeroStats(STATS, { count: 1, average: 5 })[2].value).toBe('5.0')
  })

  it('drops the rating rather than showing a broken figure', () => {
    const out = resolveHeroStats(STATS, { count: 2, average: Number.NaN })
    expect(out.some((s) => s.is_rating)).toBe(false)
  })
})

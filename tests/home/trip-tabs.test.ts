/**
 * The trip-type tabs above the hero bar. Pins one decorative icon per tab,
 * the labels unchanged, and the tablist semantics (selected tab focusable,
 * the rest roving) so adding icons cannot break the switch.
 */
import { jsx } from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { TripTabs, TRIP_TAB_ICONS } from '@/components/home/hero/search-form/trip-tabs'
import { TRIP_TYPE_LABELS } from '@/lib/trips/constants'
import type { TripType } from '@/lib/trips/types'

const ALL: TripType[] = ['one_way', 'round_trip', 'multi_city', 'hourly']
const render = (tabs: TripType[], value: TripType) =>
  renderToStaticMarkup(jsx(TripTabs, { tabs, value, onChange: () => {} }))

describe('TripTabs', () => {
  it('maps every trip type to its icon', () => {
    expect(Object.keys(TRIP_TAB_ICONS).sort()).toEqual([...ALL].sort())
  })

  it('renders each label with one hidden icon before it', () => {
    const html = render(ALL, 'one_way')
    for (const tab of ALL) {
      const button = html.match(new RegExp(`<button[^>]*data-trip="${tab}"[^>]*>(.*?)</button>`))
      expect(button).not.toBeNull()
      expect(button![1]).toMatch(/^<svg[^>]*aria-hidden="true"/)
      expect(button![1].endsWith(TRIP_TYPE_LABELS[tab])).toBe(true)
    }
    expect(html.match(/<svg/g)).toHaveLength(ALL.length)
  })

  it('keeps the tablist semantics', () => {
    const html = render(ALL, 'round_trip')
    expect(html).toContain('role="tablist"')
    expect(html).toMatch(/data-trip="round_trip" aria-selected="true" tabindex="0"/)
    expect(html).toMatch(/data-trip="one_way" aria-selected="false" tabindex="-1"/)
  })

  it('renders nothing with fewer than two tabs', () => {
    expect(render(['one_way'], 'one_way')).toBe('')
  })
})

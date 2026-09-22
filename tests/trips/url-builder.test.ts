import {
  buildCheckoutUrl,
  buildHourlyCheckoutUrl,
  buildHourlySearchUrl,
  buildMultiCityCheckoutUrl,
  buildMultiCitySearchUrl,
  buildSearchUrl,
} from '@/lib/utils/url-builder'
import { parseTripSearchParams } from '@/lib/trips/search-params'

function query(url: string): Record<string, string> {
  const raw: Record<string, string> = {}
  new URL(url, 'https://example.test').searchParams.forEach((value, key) => {
    raw[key] = value
  })
  return raw
}

describe('url-builder with trip types', () => {
  const guests = { date: '2026-10-01', passengers: 3, adults: 2, children: 1, infants: 0 }

  it('keeps one-way URLs byte-identical', () => {
    expect(buildSearchUrl('dxb', 'marina', guests)).toBe(
      '/search/dxb-to-marina?date=2026-10-01&passengers=3&adults=2&children=1&infants=0'
    )
    expect(buildSearchUrl('dxb', 'marina', guests, { trip: 'one_way' })).toBe(
      '/search/dxb-to-marina?date=2026-10-01&passengers=3&adults=2&children=1&infants=0'
    )
    expect(buildCheckoutUrl('dxb', 'marina', 'sedan', { ...guests, time: '10:00' })).toBe(
      '/checkout/dxb-to-marina/sedan?date=2026-10-01&time=10%3A00&passengers=3&adults=2&children=1&infants=0'
    )
  })

  it('carries a round trip through search and checkout', () => {
    const trip = { trip: 'round_trip' as const, returnDate: '2026-10-04' }
    expect(parseTripSearchParams(query(buildSearchUrl('dxb', 'marina', guests, trip)))).toEqual(trip)
    expect(
      parseTripSearchParams(query(buildCheckoutUrl('dxb', 'marina', 'sedan', { ...guests, time: '10:00' }, trip)))
    ).toEqual(trip)
  })

  it('builds hourly URLs without a destination', () => {
    const url = buildHourlySearchUrl('marina', { ...guests, hourlyPackage: 'full_day' })
    expect(url.startsWith('/search/hourly/marina?')).toBe(true)
    expect(parseTripSearchParams(query(url))).toEqual({ trip: 'hourly', hourlyPackage: 'full_day' })
    expect(buildHourlyCheckoutUrl('marina', 'sedan', { ...guests, hourlyPackage: 'half_day' }))
      .toMatch(/^\/checkout\/hourly\/marina\/sedan\?date=2026-10-01&passengers=3/)
  })

  it('builds multi-city URLs whose legs parse back', () => {
    const legs = [
      { from: 'dxb', to: 'marina', date: '2026-10-01' },
      { from: 'marina', to: 'auh', date: '2026-10-03' },
    ]
    const url = buildMultiCitySearchUrl(legs, guests)
    expect(url.startsWith('/search/multi-city?')).toBe(true)
    expect(parseTripSearchParams(query(url))).toEqual({ trip: 'multi_city', legs })
    expect(parseTripSearchParams(query(buildMultiCityCheckoutUrl('sedan', legs, guests))))
      .toEqual({ trip: 'multi_city', legs })
  })
})

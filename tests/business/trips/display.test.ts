import {
  businessDestinationLabel,
  businessHourlyPackageLabel,
  businessHourlySummary,
  businessLegLabel,
  businessRouteLabel,
  businessTripContextLabel,
  businessTripTypeLabel,
  businessTripTypeOf,
} from '@/lib/business/trips/display'

const hourly = { trip_type: 'hourly', hourly_package: 'half_day', duration_hours: 5, included_km: 100 }

describe('business trip display', () => {
  it('treats unknown or missing trip types as one way', () => {
    expect(businessTripTypeOf({})).toBe('one_way')
    expect(businessTripTypeOf({ trip_type: 'weird' })).toBe('one_way')
    expect(businessTripTypeLabel({ trip_type: 'multi_city' })).toBe('Multi-city')
  })

  it('labels journeys', () => {
    expect(businessLegLabel({ trip_type: 'round_trip', leg_index: 0 })).toBe('Outbound')
    expect(businessLegLabel({ trip_type: 'round_trip', leg_index: 1 })).toBe('Return')
    expect(businessLegLabel({ trip_type: 'multi_city', leg_index: 1 }, 3)).toBe('Journey 2 of 3')
    expect(businessLegLabel({ trip_type: 'one_way', leg_index: null })).toBeNull()
  })

  it('describes hourly hire', () => {
    expect(businessHourlyPackageLabel(hourly)).toBe('Half day, 5 hours')
    expect(businessHourlySummary(hourly)).toBe('Half day · 5 h · 100 km included')
    expect(businessHourlySummary({ trip_type: 'one_way' })).toBeNull()
    expect(businessDestinationLabel(hourly)).toBe('Hourly · 5 h')
    expect(businessRouteLabel(hourly, 'DXB', null)).toBe('DXB · Hourly · 5 h')
    expect(businessRouteLabel({ trip_type: 'one_way' }, 'DXB', 'Marina')).toBe('DXB → Marina')
  })

  it('names the part of a trip for per-journey emails', () => {
    expect(
      businessTripContextLabel({ trip_type: 'round_trip', leg_index: 1 }, { group_number: 'BG-1', leg_count: 2 })
    ).toBe('Round trip BG-1, return journey')
    expect(
      businessTripContextLabel({ trip_type: 'multi_city', leg_index: 2 }, { group_number: 'BG-2', leg_count: 3 })
    ).toBe('Multi-city trip BG-2, journey 3 of 3')
    expect(businessTripContextLabel(hourly)).toBe('Hourly hire: Half day, 5 hours, 100 km included, as directed')
    expect(businessTripContextLabel({ trip_type: 'one_way' })).toBeNull()
  })
})

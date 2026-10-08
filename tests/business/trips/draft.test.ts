import {
  emptyBusinessLeg,
  initialLegsFor,
  returnLegFor,
  validateBusinessTripDraft,
} from '@/lib/business/trips/draft'
import { DEFAULT_BUSINESS_TRIP_SETTINGS } from '@/lib/business/trips/settings'

const NOW = new Date('2030-01-10T06:00:00Z')
const outbound = {
  ...emptyBusinessLeg(),
  from_location_id: 'a',
  from_location_name: 'Airport',
  to_location_id: 'b',
  to_location_name: 'Hotel',
  pickup_address: 'Terminal 3',
  dropoff_address: 'Main lobby',
  date: '2030-01-11',
  time: '10:00',
}

describe('returnLegFor', () => {
  it('reverses the route and swaps addresses by default', () => {
    expect(returnLegFor(outbound)).toMatchObject({
      from_location_id: 'b',
      to_location_id: 'a',
      pickup_address: 'Main lobby',
      dropoff_address: 'Terminal 3',
      date: '',
      time: '',
    })
  })

  it('keeps the return addresses and time the user already set', () => {
    const current = { ...emptyBusinessLeg(), pickup_address: 'Side door', date: '2030-01-11', time: '18:00' }
    expect(returnLegFor(outbound, current)).toMatchObject({
      pickup_address: 'Side door',
      dropoff_address: 'Terminal 3',
      time: '18:00',
    })
  })
})

describe('initialLegsFor', () => {
  it('shapes journeys for each trip type, reusing what was entered', () => {
    expect(initialLegsFor('round_trip', [outbound])).toHaveLength(2)
    expect(initialLegsFor('multi_city', [outbound])).toHaveLength(2)
    const hourly = initialLegsFor('hourly', [outbound])
    expect(hourly).toHaveLength(1)
    expect(hourly[0]).toMatchObject({ from_location_id: 'a', to_location_id: '' })
  })
})

describe('validateBusinessTripDraft', () => {
  const settings = DEFAULT_BUSINESS_TRIP_SETTINGS

  it('passes a complete round trip in order', () => {
    const legs = [outbound, { ...returnLegFor(outbound), date: '2030-01-11', time: '18:00' }]
    expect(validateBusinessTripDraft('round_trip', legs, settings, NOW)).toBeNull()
  })

  it('only checks order on the client, leaving drive time to the server', () => {
    const legs = [outbound, { ...returnLegFor(outbound), date: '2030-01-11', time: '10:05' }]
    expect(validateBusinessTripDraft('round_trip', legs, settings, NOW)).toBeNull()
    const backwards = [outbound, { ...returnLegFor(outbound), date: '2030-01-11', time: '09:00' }]
    expect(validateBusinessTripDraft('round_trip', backwards, settings, NOW)).toMatch(/too soon/)
  })

  it('names the missing field', () => {
    expect(validateBusinessTripDraft('multi_city', [outbound, emptyBusinessLeg()], settings, NOW)).toMatch(/Journey 2: choose both/)
    expect(validateBusinessTripDraft('round_trip', [outbound, { ...returnLegFor(outbound) }], settings, NOW)).toMatch(/Return: choose a date/)
    expect(validateBusinessTripDraft('hourly', [emptyBusinessLeg()], settings, NOW)).toMatch(/pickup location/)
  })

  it('applies hourly notice', () => {
    const hourly = [{ ...outbound, to_location_id: '', date: '2030-01-10', time: '12:00' }]
    expect(validateBusinessTripDraft('hourly', hourly, settings, NOW)).toMatch(/notice/)
  })

  it('never blocks one way', () => {
    expect(validateBusinessTripDraft('one_way', [], settings, NOW)).toBeNull()
  })
})

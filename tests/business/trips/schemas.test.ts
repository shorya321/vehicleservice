import { businessTripCreationSchema } from '@/lib/business/trips/schemas'

const uuid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`
const shared = {
  customer_name: 'Trip Tester',
  customer_email: 'trip@example.com',
  customer_phone: '+971501234567',
  vehicle_type_id: uuid(9),
  passenger_count: 2,
  adults: 2,
  children: 0,
  infants: 0,
  base_price: 200,
  price_signature: 'sig',
  price_signature_timestamp: 1,
  price_signature_nonce: 'nonce',
}
const leg = (from: number, to: number, time: string) => ({
  from_location_id: uuid(from),
  to_location_id: uuid(to),
  pickup_address: 'Terminal 3 arrivals',
  dropoff_address: 'Hotel main lobby',
  date: '2030-01-11',
  time,
})

describe('businessTripCreationSchema', () => {
  it('accepts a round trip with exactly two journeys', () => {
    expect(businessTripCreationSchema.safeParse({ ...shared, trip_type: 'round_trip', legs: [leg(1, 2, '10:00'), leg(2, 1, '18:00')] }).success).toBe(true)
    expect(businessTripCreationSchema.safeParse({ ...shared, trip_type: 'round_trip', legs: [leg(1, 2, '10:00')] }).success).toBe(false)
  })

  it('accepts 2 to 6 multi-city journeys', () => {
    const legs = [leg(1, 2, '08:00'), leg(2, 3, '11:00'), leg(3, 4, '14:00')]
    expect(businessTripCreationSchema.safeParse({ ...shared, trip_type: 'multi_city', legs }).success).toBe(true)
    const seven = Array.from({ length: 7 }, (_, i) => leg(1, 2, `0${i}:00`))
    expect(businessTripCreationSchema.safeParse({ ...shared, trip_type: 'multi_city', legs: seven }).success).toBe(false)
  })

  it('accepts an hourly hire and rejects an unknown package', () => {
    const hourly = { from_location_id: uuid(1), pickup_address: 'Terminal 3 arrivals', date: '2030-01-11', time: '10:00', hourly_package: 'half_day' }
    expect(businessTripCreationSchema.safeParse({ ...shared, trip_type: 'hourly', hourly }).success).toBe(true)
    expect(businessTripCreationSchema.safeParse({ ...shared, trip_type: 'hourly', hourly: { ...hourly, hourly_package: 'week' } }).success).toBe(false)
  })

  it('rejects one way (it has its own endpoint) and a guest count that does not add up', () => {
    expect(businessTripCreationSchema.safeParse({ ...shared, trip_type: 'one_way', legs: [] }).success).toBe(false)
    expect(
      businessTripCreationSchema.safeParse({ ...shared, passenger_count: 3, trip_type: 'round_trip', legs: [leg(1, 2, '10:00'), leg(2, 1, '18:00')] }).success
    ).toBe(false)
  })
})

import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { resolveLocationsBySlug, type TripLocation } from '@/lib/trips/locations-server'
import { lookupZoneBasePrice } from '@/lib/trips/pricing-server'
import { quoteTrip, roundMoney } from '@/lib/trips/pricing'
import type { TripLegParam } from '@/lib/trips/types'
import type { VehicleTypeResult, VehicleTypesByCategory } from '../results/actions'
import { getVehicleTypesForParty, groupByCategory, lowestBookablePrice, toVehicleTypeResult } from '../lib/trip-results'

export interface ResolvedLeg extends TripLegParam {
  fromLocation: TripLocation
  toLocation: TripLocation
}

export interface MultiCityResults {
  legs: ResolvedLeg[]
  vehicleTypes: VehicleTypeResult[]
  vehicleTypesByCategory: VehicleTypesByCategory[]
  minPrice: number | null
}

/**
 * Every vehicle that seats the party, priced for all journeys together. A vehicle is
 * offered only when every journey has a zone price; otherwise its card names the journey
 * that cannot be booked. Null when a location in the URL does not resolve (404).
 */
export async function getMultiCityResults(legs: TripLegParam[], passengers: number): Promise<MultiCityResults | null> {
  const supabase = await createClient()
  const locations = await resolveLocationsBySlug(supabase, legs.flatMap((leg) => [leg.from, leg.to]))

  const resolved: ResolvedLeg[] = []
  for (const leg of legs) {
    const fromLocation = locations.get(leg.from)
    const toLocation = locations.get(leg.to)
    if (!fromLocation || !toLocation) return null
    resolved.push({ ...leg, fromLocation, toLocation })
  }

  const [vehicleRows, bases] = await Promise.all([
    getVehicleTypesForParty(passengers),
    Promise.all(resolved.map((leg) => lookupZoneBasePrice(supabase, leg.fromLocation.id, leg.toLocation.id))),
  ])

  const unpricedLeg = bases.findIndex((base) => base === null)
  const blockedLeg = resolved.findIndex((leg) => !leg.fromLocation.allowPickup || !leg.toLocation.allowDropoff)

  const vehicleTypes = vehicleRows.map((row) => {
    const problem = unpricedLeg !== -1 ? unpricedLeg : blockedLeg
    if (problem !== -1) {
      return toVehicleTypeResult(row, 0, {
        available: false,
        unavailableReason: `Journey ${problem + 1} not available`,
        tripPricing: { label: 'Whole trip', caption: `${resolved.length} journeys`, details: [] },
      })
    }

    const quote = quoteTrip(
      bases.map((base) => ({ baseFare: roundMoney((base as number) * row.priceMultiplier) })),
      0
    )
    return toVehicleTypeResult(row, quote.total, {
      available: true,
      tripPricing: {
        label: 'Whole trip',
        caption: `${resolved.length} journeys`,
        details: ['The same class on every journey'],
      },
    })
  })

  return {
    legs: resolved,
    vehicleTypes,
    vehicleTypesByCategory: groupByCategory(vehicleTypes),
    minPrice: lowestBookablePrice(vehicleTypes),
  }
}

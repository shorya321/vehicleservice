import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { getHourlyPackagesByVehicleType } from '@/lib/trips/pricing-server'
import { resolveLocationBySlug, type TripLocation } from '@/lib/trips/locations-server'
import { HOURLY_PACKAGE_LABELS } from '@/lib/trips/constants'
import type { HourlyPackage } from '@/lib/trips/types'
import type { VehicleTypeResult, VehicleTypesByCategory } from '../../results/actions'
import {
  getVehicleTypesForParty,
  groupByCategory,
  lowestBookablePrice,
  toVehicleTypeResult,
} from '../../lib/trip-results'

export interface HourlyResults {
  origin: TripLocation
  hourlyPackage: HourlyPackage
  vehicleTypes: VehicleTypeResult[]
  vehicleTypesByCategory: VehicleTypesByCategory[]
  minPrice: number | null
  /** Hours of the cheapest package shown, for the header. */
  hours: number | null
}

function formatHours(hours: number): string {
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

/**
 * Vehicle types that have an active package of this kind and seat the party.
 * A vehicle with no package is not offered for hourly hire at all.
 * Returns null when the origin slug does not resolve (404).
 */
export async function getHourlyResults(
  originSlug: string,
  hourlyPackage: HourlyPackage,
  passengers: number
): Promise<HourlyResults | null> {
  const supabase = await createClient()
  const origin = await resolveLocationBySlug(supabase, originSlug)
  // A location that does not take pickups cannot start an hourly hire.
  if (!origin || !origin.allowPickup) return null

  const [vehicleRows, packages] = await Promise.all([
    getVehicleTypesForParty(passengers),
    getHourlyPackagesByVehicleType(supabase, hourlyPackage),
  ])

  const vehicleTypes = vehicleRows.flatMap((row) => {
    const pkg = packages.get(row.id)
    if (!pkg) return []
    return [
      toVehicleTypeResult(row, pkg.price, {
        available: true,
        tripPricing: {
          label: HOURLY_PACKAGE_LABELS[hourlyPackage],
          caption: `for ${formatHours(pkg.hours)}`,
          details: [`${formatHours(pkg.hours)} with chauffeur, ${pkg.includedKm} km included`],
          extraHourPrice: pkg.extraHourPrice,
        },
      }),
    ]
  })

  const cheapest = [...vehicleTypes].sort((a, b) => a.price - b.price)[0]
  const cheapestHours = cheapest ? packages.get(cheapest.id)?.hours ?? null : null

  return {
    origin,
    hourlyPackage,
    vehicleTypes,
    vehicleTypesByCategory: groupByCategory(vehicleTypes),
    minPrice: lowestBookablePrice(vehicleTypes),
    hours: cheapestHours,
  }
}

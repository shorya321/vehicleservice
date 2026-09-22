import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { lookupZoneBasePrice } from '@/lib/trips/pricing-server'
import { quoteTrip, roundMoney } from '@/lib/trips/pricing'
import type { VehicleTypeResult } from '../results/actions'
import { groupByCategory } from './trip-results'

/**
 * Re-prices the one-way results for a round trip: outbound plus the reverse
 * route, less the admin's round-trip discount, exactly as checkout will charge.
 *
 * Strict where one way is lenient: a leg with no zone price makes the vehicle
 * unbookable for the round trip (with the reason on the card) instead of
 * falling back to a placeholder fare.
 */
export async function toRoundTripResults(
  vehicleTypes: VehicleTypeResult[],
  originId: string,
  destinationId: string,
  discountPercent: number
) {
  const supabase = await createClient()
  const ids = vehicleTypes.map((vt) => vt.id)

  const [outboundBase, returnBase, { data: multipliers }] = await Promise.all([
    lookupZoneBasePrice(supabase, originId, destinationId),
    lookupZoneBasePrice(supabase, destinationId, originId),
    ids.length > 0
      ? supabase.from('vehicle_types').select('id, price_multiplier').in('id', ids)
      : Promise.resolve({ data: [] as { id: string; price_multiplier: number | null }[] }),
  ])

  const multiplierById = new Map((multipliers ?? []).map((row) => [row.id, Number(row.price_multiplier) || 1]))

  const priced = vehicleTypes.map((vt): VehicleTypeResult => {
    const multiplier = multiplierById.get(vt.id) ?? 1

    if (outboundBase === null || returnBase === null) {
      return {
        ...vt,
        availableVehicles: 0,
        unavailableReason: outboundBase === null ? 'Round trip not available' : 'Return not available',
        tripPricing: { label: 'Round trip', caption: 'both ways', details: [] },
      }
    }

    const quote = quoteTrip(
      [
        { baseFare: roundMoney(outboundBase * multiplier) },
        { baseFare: roundMoney(returnBase * multiplier) },
      ],
      discountPercent
    )

    return {
      ...vt,
      price: quote.total,
      tripPricing: {
        label: 'Round trip',
        caption: 'both ways',
        details: [
          'Outbound and return in the same class',
          ...(quote.discount > 0 ? [`Includes a ${quote.discountPercent}% round trip saving`] : []),
        ],
      },
    }
  })

  return { vehicleTypes: priced, vehicleTypesByCategory: groupByCategory(priced) }
}

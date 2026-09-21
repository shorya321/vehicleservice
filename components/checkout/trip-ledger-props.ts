import { AS_DIRECTED, HOURLY_PACKAGE_LABELS } from '@/lib/trips/constants'
import {
  addMinutesToClock,
  addonMultiplier,
  isGroupedCheckout,
  type CheckoutPriceBreakdown,
  type CheckoutTrip,
} from '@/lib/trips/checkout-trip'
import { roundMoney } from '@/lib/trips/pricing'
import type { LedgerAddon, LedgerLeg } from './booking-ledger'

/** Date and time the customer has chosen for each leg (index-aligned with `trip.legs`). */
export interface LegSchedule {
  date: string
  time: string
}

/** `yyyy-MM-dd` as a short calendar label. Parsed and formatted locally on purpose (a calendar date, not an instant). */
export function shortDateLabel(date: string | undefined): string {
  if (!date) return ''
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export interface TripLedgerOverrides {
  destinationName?: string
  arrivalNote?: string | null
  baseLabel?: string
  legs?: LedgerLeg[]
  tripDiscount?: { label: string; amount: number } | null
  addons: LedgerAddon[]
  addonNote?: string
  capNote?: string | null
  heading: string
}

/**
 * The trip-specific parts of the summary card. One way returns the addons
 * untouched and no overrides, so its card renders exactly as before.
 */
export function tripLedgerOverrides(
  trip: CheckoutTrip,
  pricing: CheckoutPriceBreakdown,
  addons: LedgerAddon[],
  pickupTime: string | undefined,
  schedule: LegSchedule[]
): TripLedgerOverrides {
  if (trip.kind === 'hourly') {
    const until = addMinutesToClock(pickupTime, Math.round(trip.hours * 60))
    return {
      destinationName: AS_DIRECTED,
      arrivalNote: until ? `Until about ${until}` : null,
      baseLabel: `${HOURLY_PACKAGE_LABELS[trip.hourlyPackage]}, ${trip.hours} hours`,
      addons,
      capNote: `${trip.hours} h · ${trip.includedKm} km included`,
      heading: 'Your hourly hire',
    }
  }

  if (isGroupedCheckout(trip)) {
    const count = addonMultiplier(trip)
    const legs: LedgerLeg[] = trip.legs.map((leg, index) => ({
      key: `${index}-${leg.fromId}-${leg.toId}`,
      label: trip.kind === 'round_trip' ? (index === 0 ? 'Outbound' : 'Return') : `Journey ${index + 1}`,
      originName: leg.fromName,
      destinationName: leg.toName,
      dateLabel: shortDateLabel(schedule[index]?.date ?? leg.date),
      timeLabel: schedule[index]?.time || leg.time,
      fare: leg.baseFare,
    }))
    return {
      legs,
      tripDiscount: pricing.discount > 0
        ? { label: `Round trip saving (${trip.discountPercent}%)`, amount: pricing.discount }
        : null,
      addons: addons.map((addon) => ({ ...addon, total_price: roundMoney(addon.total_price * count) })),
      addonNote: `(${count} journeys)`,
      capNote: `${trip.legs.length} journeys`,
      heading: trip.kind === 'round_trip' ? 'Your round trip' : 'Your trip',
    }
  }

  return { addons, heading: 'Your transfer' }
}

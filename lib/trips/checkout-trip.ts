import { quoteTrip, roundMoney } from './pricing'
import type { HourlyPackage, TripQuote } from './types'

/**
 * What the checkout page knows about the trip being booked, built on the
 * server and handed to the client components. One way is the historical
 * checkout and carries nothing extra.
 */
export interface CheckoutLeg {
  fromId: string
  fromName: string
  toId: string
  toName: string
  /** `yyyy-MM-dd` from the search; the customer may change it at checkout. */
  date: string
  /** `HH:mm`, when known. */
  time?: string
  /** Zone fare times the vehicle multiplier, before any discount. */
  baseFare: number
  durationMinutes: number | null
}

export type CheckoutTrip =
  | { kind: 'one_way' }
  | {
      kind: 'hourly'
      hourlyPackage: HourlyPackage
      hours: number
      includedKm: number
      extraHourPrice: number
      price: number
      minNoticeHours: number
    }
  | {
      kind: 'round_trip' | 'multi_city'
      legs: CheckoutLeg[]
      discountPercent: number
      bufferMinutes: number
      maxLegs: number
    }

export type GroupedCheckoutTrip = Extract<CheckoutTrip, { kind: 'round_trip' | 'multi_city' }>
export type HourlyCheckoutTrip = Extract<CheckoutTrip, { kind: 'hourly' }>

export function isGroupedCheckout(trip: CheckoutTrip): trip is GroupedCheckoutTrip {
  return trip.kind === 'round_trip' || trip.kind === 'multi_city'
}

/** How many transfers an add-on is bought for. A child seat on a round trip is needed both ways. */
export function addonMultiplier(trip: CheckoutTrip): number {
  return isGroupedCheckout(trip) ? trip.legs.length : 1
}

export interface CheckoutPriceBreakdown {
  /** Fare before add-ons and discount (sum of leg fares, or the package, or the transfer fare). */
  baseFare: number
  discount: number
  /** Add-ons as priced (already multiplied across legs). */
  addons: number
  total: number
  quote: TripQuote | null
}

/**
 * The same arithmetic the server repeats on submit, so what the summary shows
 * is what gets charged. `transferFare` is the one-way price from the page.
 */
export function checkoutPrice(
  trip: CheckoutTrip,
  transferFare: number,
  addonsPerTransfer: number
): CheckoutPriceBreakdown {
  if (trip.kind === 'hourly') {
    const addons = roundMoney(addonsPerTransfer)
    return { baseFare: trip.price, discount: 0, addons, total: roundMoney(trip.price + addons), quote: null }
  }

  if (isGroupedCheckout(trip)) {
    const quote = quoteTrip(
      trip.legs.map((leg) => ({ baseFare: leg.baseFare, addons: addonsPerTransfer })),
      trip.kind === 'round_trip' ? trip.discountPercent : 0
    )
    const baseFare = roundMoney(trip.legs.reduce((sum, leg) => sum + leg.baseFare, 0))
    return {
      baseFare,
      discount: quote.discount,
      addons: roundMoney(quote.subtotal - baseFare),
      total: quote.total,
      quote,
    }
  }

  const addons = roundMoney(addonsPerTransfer)
  return { baseFare: transferFare, discount: 0, addons, total: roundMoney(transferFare + addons), quote: null }
}

/** Wall-clock `HH:mm` plus minutes, wrapping at midnight. Both ends are operating-timezone. */
export function addMinutesToClock(time: string | undefined, minutes: number | null | undefined): string | null {
  if (!time || !minutes) return null
  const [h, m] = time.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  const total = h * 60 + m + minutes
  const hh = Math.floor(total / 60) % 24
  return `${String(hh).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

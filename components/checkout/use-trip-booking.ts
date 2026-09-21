'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createGroupBooking, createHourlyBooking } from '@/app/checkout/trip-actions'
import { buildPaymentUrl } from '@/lib/utils/url-builder'
import { isGroupedCheckout, type CheckoutTrip } from '@/lib/trips/checkout-trip'
import { validateHourlyStart, validateLegTiming } from '@/lib/trips/validation'
import type { GuestBreakdown } from '@/components/home/hero/guest-breakdown'
import type { LegSchedule } from './trip-ledger-props'

/** The contact and extras half of the form, as the trip actions take it. */
export interface TripContactValues {
  pickupDate: string
  pickupTime: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialRequests?: string
  selectedAddons?: Array<{
    addon_id: string
    quantity: number
    unit_price: number
    total_price: number
    child_ages?: (number | null)[]
  }>
}

interface UseTripBookingArgs {
  trip: CheckoutTrip
  vehicleTypeId: string
  originId: string
  guests: GuestBreakdown
  passengers: number
  /** The form's own pickup date and time, which are journey 1 of a grouped trip. */
  pickupDate: string
  pickupTime: string
  onScheduleChange?: (schedule: LegSchedule[]) => void
}

/**
 * Everything the checkout form does differently for hourly hire, round trips
 * and multi-city trips: the per-journey schedule, the timing rules checked
 * before the customer moves on, and the booking action each one submits to.
 * One way never touches it.
 */
export function useTripBooking({
  trip,
  vehicleTypeId,
  originId,
  guests,
  passengers,
  pickupDate,
  pickupTime,
  onScheduleChange,
}: UseTripBookingArgs) {
  const router = useRouter()
  const grouped = isGroupedCheckout(trip)

  // Journeys 2..n. Journey 1 lives in the form's own pickupDate/pickupTime fields.
  const [laterLegs, setLaterLegs] = useState<LegSchedule[]>(() =>
    grouped ? trip.legs.slice(1).map((leg) => ({ date: leg.date, time: leg.time ?? '' })) : []
  )
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const schedule = useMemo<LegSchedule[]>(
    () => (grouped ? [{ date: pickupDate, time: pickupTime }, ...laterLegs] : []),
    [grouped, pickupDate, pickupTime, laterLegs]
  )

  useEffect(() => {
    if (grouped) onScheduleChange?.(schedule)
  }, [grouped, schedule, onScheduleChange])

  const updateLeg = useCallback((index: number, patch: Partial<LegSchedule>) => {
    setScheduleError(null)
    // `index` counts from journey 1; journey 1 itself is edited through the form fields.
    setLaterLegs((prev) => prev.map((leg, i) => (i === index - 1 ? { ...leg, ...patch } : leg)))
  }, [])

  /** Null when every journey is complete and in order. */
  const validateSchedule = useCallback((): string | null => {
    if (!isGroupedCheckout(trip)) return null
    const missing = schedule.findIndex((leg) => !leg.date || !leg.time)
    if (missing !== -1) {
      return `Choose a pickup time for ${trip.kind === 'round_trip' && missing === 1 ? 'your return' : `journey ${missing + 1}`}.`
    }
    return validateLegTiming(
      trip.legs.map((leg, index) => ({
        fromId: leg.fromId,
        toId: leg.toId,
        date: schedule[index].date,
        time: schedule[index].time,
        durationMinutes: leg.durationMinutes,
      })),
      { bufferMinutes: trip.bufferMinutes, maxLegs: trip.maxLegs }
    )
  }, [trip, schedule])

  /** Run before leaving the details step. Returns false (and shows why) when it must not. */
  const checkBeforeContinue = useCallback((): boolean => {
    let error: string | null = null
    if (trip.kind === 'hourly') {
      error = validateHourlyStart(pickupDate, pickupTime, { minNoticeHours: trip.minNoticeHours })
    } else {
      error = validateSchedule()
    }
    setScheduleError(error)
    if (error) toast.error(error)
    return !error
  }, [trip, pickupDate, pickupTime, validateSchedule])

  /** Submits a trip-type booking. Returns false for one way, which the caller submits itself. */
  const submit = useCallback(async (values: TripContactValues): Promise<boolean> => {
    if (trip.kind === 'one_way') return false

    if (!checkBeforeContinue()) return true

    const contact = {
      vehicleTypeId,
      passengerCount: passengers,
      adults: guests.adults,
      children: guests.children,
      infants: guests.infants,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      specialRequests: values.specialRequests,
      agreeToTerms: true as const,
      paymentMethod: 'card' as const,
      // superRefine has guaranteed every age is filled in; `requires_child_age` is re-derived server-side.
      selectedAddons: values.selectedAddons?.map((a) => ({
        addon_id: a.addon_id,
        quantity: a.quantity,
        unit_price: a.unit_price,
        total_price: a.total_price,
        ...(a.child_ages ? { child_ages: a.child_ages.filter((v): v is number => v !== null) } : {}),
      })),
    }

    const result =
      trip.kind === 'hourly'
        ? await createHourlyBooking({
            ...contact,
            fromLocationId: originId,
            hourlyPackage: trip.hourlyPackage,
            pickupDate: values.pickupDate,
            pickupTime: values.pickupTime,
          })
        : await createGroupBooking({
            ...contact,
            tripType: trip.kind,
            legs: trip.legs.map((leg, index) => ({
              fromLocationId: leg.fromId,
              toLocationId: leg.toId,
              date: schedule[index].date,
              time: schedule[index].time,
            })),
          })

    if (result.success) {
      router.push(buildPaymentUrl(result.reference))
    } else {
      setScheduleError(result.error)
      toast.error(result.error)
    }
    return true
  }, [trip, checkBeforeContinue, vehicleTypeId, passengers, guests, originId, schedule, router])

  return { schedule, updateLeg, scheduleError, checkBeforeContinue, submit }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { signBookingPayload, signGroupPayload } from '@/lib/security/booking-hmac'
import { bookingWallClockToUtc } from '@/lib/utils/timezone'
import { getSiteSettings } from '@/lib/site-settings/server'
import { AS_DIRECTED } from '@/lib/trips/constants'
import { getHourlyPackage, quoteLegFare } from '@/lib/trips/pricing-server'
import { getRouteDurationMinutes, resolveLocationsById } from '@/lib/trips/locations-server'
import { quoteTrip, roundMoney } from '@/lib/trips/pricing'
import { validateHourlyStart, validateLegTiming } from '@/lib/trips/validation'
import {
  BookingInputError,
  amenityRows,
  assertPartyFits,
  groupBookingSchema,
  newBookingNumber,
  newGroupNumber,
  primaryPassengerRow,
  hourlyBookingSchema,
  requireBookingCustomer,
  verifyAddons,
  type GroupBookingInput,
  type HourlyBookingInput,
} from './lib/booking-core'

/**
 * Booking actions for hourly hire (this file) and grouped trips. They return a
 * result object instead of throwing: Next replaces thrown messages with a
 * generic error in production, and the customer needs to know which rule
 * stopped the booking.
 */
type TripBookingResult =
  | { success: true; reference: string }
  | { success: false; error: string }
// Types stay in ./lib/booking-core: a 'use server' file may only export async functions.

function failure(error: unknown, fallback: string): TripBookingResult {
  if (error instanceof BookingInputError) return { success: false, error: error.message }
  console.error('[trip-actions]', error)
  return { success: false, error: fallback }
}

export async function createHourlyBooking(input: HourlyBookingInput): Promise<TripBookingResult> {
  try {
    const { userId } = await requireBookingCustomer()

    const parsed = hourlyBookingSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Some booking details are missing or invalid. Please review the form.' }
    }
    const data = parsed.data

    const settings = await getSiteSettings()
    if (!settings.trip_types.hourly_enabled) {
      return { success: false, error: 'Hourly hire is not available at the moment.' }
    }

    const timingError = validateHourlyStart(data.pickupDate, data.pickupTime, {
      minNoticeHours: settings.trip_types.hourly_min_notice_hours,
    })
    if (timingError) return { success: false, error: timingError }

    const adminClient = createAdminClient()

    const [{ data: vehicleType }, locations, pkg] = await Promise.all([
      adminClient
        .from('vehicle_types')
        .select('id, passenger_capacity')
        .eq('id', data.vehicleTypeId)
        .eq('is_active', true)
        .maybeSingle(),
      resolveLocationsById(adminClient, [data.fromLocationId]),
      getHourlyPackage(adminClient, data.vehicleTypeId, data.hourlyPackage),
    ])

    if (!vehicleType) return { success: false, error: 'This vehicle is no longer available.' }
    const origin = locations.get(data.fromLocationId)
    if (!origin || !origin.allowPickup) {
      return { success: false, error: 'Pickups are not available at this location.' }
    }
    if (!pkg) return { success: false, error: 'This package is no longer offered for this vehicle.' }

    assertPartyFits(data, vehicleType.passenger_capacity)
    const { perTransfer: amenitiesPrice, addons } = await verifyAddons(adminClient, data.selectedAddons, data)

    const basePrice = pkg.price
    const totalPrice = roundMoney(basePrice + amenitiesPrice)
    const bookingNumber = newBookingNumber()

    const { data: booking, error: insertError } = await adminClient
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        // Set by the set_booking_trip_number trigger (code H for hourly); the value here is replaced.
        trip_number: bookingNumber,
        customer_id: userId,
        vehicle_type_id: data.vehicleTypeId,
        trip_type: 'hourly',
        hourly_package: data.hourlyPackage,
        duration_hours: pkg.hours,
        included_km: pkg.includedKm,
        extra_hour_price: pkg.extraHourPrice,
        from_location_id: origin.id,
        to_location_id: null,
        from_zone_id: origin.zoneId,
        to_zone_id: null,
        pickup_address: origin.name,
        dropoff_address: AS_DIRECTED,
        pickup_datetime: bookingWallClockToUtc(data.pickupDate, data.pickupTime).toISOString(),
        passenger_count: data.passengerCount,
        adults: data.adults,
        children: data.children,
        infants: data.infants,
        base_price: basePrice,
        amenities_price: amenitiesPrice,
        total_price: totalPrice,
        currency: 'AED',
        booking_status: 'pending',
        payment_status: 'processing',
        customer_notes: data.specialRequests?.trim() || null,
      })
      .select('id, booking_number')
      .single()

    if (insertError || !booking) {
      console.error('[trip-actions] hourly insert failed:', insertError)
      return { success: false, error: 'We could not create your booking. You have not been charged. Please try again.' }
    }

    const rollback = async (reason: string): Promise<TripBookingResult> => {
      const { error } = await adminClient.from('bookings').delete().eq('id', booking.id)
      if (error) console.error('[trip-actions] rollback failed:', error)
      return { success: false, error: reason }
    }

    const { signature, timestamp, nonce } = signBookingPayload({
      bookingId: booking.id,
      totalPrice,
      customerId: userId,
      vehicleTypeId: data.vehicleTypeId,
    })
    const { error: sigError } = await adminClient
      .from('bookings')
      .update({ price_signature: signature, price_signature_timestamp: timestamp, price_signature_nonce: nonce })
      .eq('id', booking.id)
    if (sigError) return rollback('We could not secure your booking. You have not been charged. Please try again.')

    const { error: passengerError } = await adminClient
      .from('booking_passengers')
      .insert(primaryPassengerRow(booking.id, data))
    if (passengerError) return rollback('We could not save the passenger details. Please try again.')

    if (addons.length > 0) {
      const { error: amenitiesError } = await adminClient.from('booking_amenities').insert(amenityRows(booking.id, addons))
      if (amenitiesError) {
        return rollback('Failed to save the selected extras. Your booking was not created, and you have not been charged. Please try again.')
      }
    }

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/bookings')
    revalidatePath('/account')

    return { success: true, reference: booking.booking_number }
  } catch (error) {
    return failure(error, 'We could not create your booking. You have not been charged. Please try again.')
  }
}

export async function createGroupBooking(input: GroupBookingInput): Promise<TripBookingResult> {
  try {
    const { userId } = await requireBookingCustomer()

    const parsed = groupBookingSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'Some booking details are missing or invalid. Please review the form.' }
    }
    const data = parsed.data
    const isRoundTrip = data.tripType === 'round_trip'

    const settings = await getSiteSettings()
    const tripSettings = settings.trip_types
    if (isRoundTrip ? !tripSettings.round_trip_enabled : !tripSettings.multi_city_enabled) {
      return { success: false, error: `${isRoundTrip ? 'Round trips are' : 'Multi-city trips are'} not available at the moment.` }
    }

    const maxLegs = isRoundTrip ? 2 : tripSettings.multi_city_max_legs
    if (isRoundTrip) {
      const [outbound, back] = data.legs
      if (
        data.legs.length !== 2 ||
        back.fromLocationId !== outbound.toLocationId ||
        back.toLocationId !== outbound.fromLocationId
      ) {
        return { success: false, error: 'A round trip returns along the same route. Please search again.' }
      }
    }

    const adminClient = createAdminClient()
    const locationIds = data.legs.flatMap((leg) => [leg.fromLocationId, leg.toLocationId])
    const [{ data: vehicleType }, locations] = await Promise.all([
      adminClient
        .from('vehicle_types')
        .select('id, passenger_capacity, price_multiplier')
        .eq('id', data.vehicleTypeId)
        .eq('is_active', true)
        .maybeSingle(),
      resolveLocationsById(adminClient, locationIds),
    ])
    if (!vehicleType) return { success: false, error: 'This vehicle is no longer available.' }

    for (let index = 0; index < data.legs.length; index += 1) {
      const leg = data.legs[index]
      const from = locations.get(leg.fromLocationId)
      const to = locations.get(leg.toLocationId)
      if (!from || !to) return { success: false, error: `Journey ${index + 1}: a location is no longer available.` }
      if (!from.allowPickup) return { success: false, error: `Journey ${index + 1}: pickups are not available at ${from.name}.` }
      if (!to.allowDropoff) return { success: false, error: `Journey ${index + 1}: drop-offs are not available at ${to.name}.` }
    }

    const [fares, durations] = await Promise.all([
      Promise.all(
        data.legs.map((leg) =>
          quoteLegFare(adminClient, leg.fromLocationId, leg.toLocationId, Number(vehicleType.price_multiplier))
        )
      ),
      Promise.all(data.legs.map((leg) => getRouteDurationMinutes(adminClient, leg.fromLocationId, leg.toLocationId))),
    ])
    const unpriced = fares.findIndex((fare) => fare === null)
    if (unpriced !== -1) {
      return { success: false, error: `Journey ${unpriced + 1} has no price for this vehicle. Please choose another vehicle or route.` }
    }

    const timingError = validateLegTiming(
      data.legs.map((leg, index) => ({
        fromId: leg.fromLocationId,
        toId: leg.toLocationId,
        date: leg.date,
        time: leg.time,
        durationMinutes: durations[index],
      })),
      { bufferMinutes: tripSettings.leg_buffer_minutes, maxLegs }
    )
    if (timingError) return { success: false, error: timingError }

    assertPartyFits(data, vehicleType.passenger_capacity)
    const { perTransfer, addons } = await verifyAddons(adminClient, data.selectedAddons, data)

    const discountPercent = isRoundTrip ? tripSettings.round_trip_discount_percent : 0
    const quote = quoteTrip(
      fares.map((fare) => ({ baseFare: fare as number, addons: perTransfer })),
      discountPercent
    )

    const groupNumber = newGroupNumber()
    const { data: group, error: groupError } = await adminClient
      .from('booking_groups')
      .insert({
        group_number: groupNumber,
        customer_id: userId,
        trip_type: data.tripType,
        leg_count: data.legs.length,
        vehicle_type_id: data.vehicleTypeId,
        currency: 'AED',
        subtotal: quote.subtotal,
        discount_percent: quote.discountPercent,
        discount_amount: quote.discount,
        total_price: quote.total,
        booking_status: 'pending',
        payment_status: 'processing',
      })
      .select('id, group_number')
      .single()

    if (groupError || !group) {
      console.error('[trip-actions] group insert failed:', groupError)
      return { success: false, error: 'We could not create your booking. You have not been charged. Please try again.' }
    }

    // Deleting the group cascades to every journey, passenger and extra written below.
    const rollback = async (reason: string): Promise<TripBookingResult> => {
      const { error } = await adminClient.from('booking_groups').delete().eq('id', group.id)
      if (error) console.error('[trip-actions] group rollback failed:', error)
      return { success: false, error: reason }
    }

    const notes = data.specialRequests?.trim() || null
    const legRows = data.legs.map((leg, index) => {
      const from = locations.get(leg.fromLocationId)!
      const to = locations.get(leg.toLocationId)!
      const bookingNumber = `${newBookingNumber()}${index + 1}`
      return {
        booking_number: bookingNumber,
        // Replaced by the set_booking_trip_number trigger.
        trip_number: bookingNumber,
        customer_id: userId,
        vehicle_type_id: data.vehicleTypeId,
        trip_type: data.tripType,
        booking_group_id: group.id,
        leg_index: index,
        from_location_id: from.id,
        to_location_id: to.id,
        from_zone_id: from.zoneId,
        to_zone_id: to.zoneId,
        pickup_address: from.name,
        dropoff_address: to.name,
        pickup_datetime: bookingWallClockToUtc(leg.date, leg.time).toISOString(),
        passenger_count: data.passengerCount,
        adults: data.adults,
        children: data.children,
        infants: data.infants,
        base_price: quote.legs[index].base,
        discount_amount: quote.legs[index].discount,
        amenities_price: perTransfer,
        total_price: quote.legs[index].total,
        currency: 'AED',
        booking_status: 'pending',
        payment_status: 'processing',
        customer_notes: notes,
      }
    })

    // One statement, so the journeys are written together or not at all.
    const { data: legs, error: legsError } = await adminClient
      .from('bookings')
      .insert(legRows)
      .select('id, leg_index')

    if (legsError || !legs || legs.length !== data.legs.length) {
      console.error('[trip-actions] leg insert failed:', legsError)
      return rollback('We could not create your booking. You have not been charged. Please try again.')
    }

    const { signature, timestamp, nonce } = signGroupPayload({
      groupId: group.id,
      totalPrice: quote.total,
      customerId: userId,
      vehicleTypeId: data.vehicleTypeId,
      legCount: data.legs.length,
    })
    const { error: sigError } = await adminClient
      .from('booking_groups')
      .update({ price_signature: signature, price_signature_timestamp: timestamp, price_signature_nonce: nonce })
      .eq('id', group.id)
    if (sigError) return rollback('We could not secure your booking. You have not been charged. Please try again.')

    const { error: passengerError } = await adminClient
      .from('booking_passengers')
      .insert(legs.map((leg) => primaryPassengerRow(leg.id, data)))
    if (passengerError) return rollback('We could not save the passenger details. Please try again.')

    if (addons.length > 0) {
      const { error: amenitiesError } = await adminClient
        .from('booking_amenities')
        .insert(legs.flatMap((leg) => amenityRows(leg.id, addons)))
      if (amenitiesError) {
        return rollback('Failed to save the selected extras. Your booking was not created, and you have not been charged. Please try again.')
      }
    }

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/bookings')
    revalidatePath('/account')

    return { success: true, reference: group.group_number }
  } catch (error) {
    return failure(error, 'We could not create your booking. You have not been charged. Please try again.')
  }
}

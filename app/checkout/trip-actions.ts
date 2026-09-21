'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { signBookingPayload } from '@/lib/security/booking-hmac'
import { bookingWallClockToUtc } from '@/lib/utils/timezone'
import { getSiteSettings } from '@/lib/site-settings/server'
import { AS_DIRECTED } from '@/lib/trips/constants'
import { getHourlyPackage } from '@/lib/trips/pricing-server'
import { resolveLocationsById } from '@/lib/trips/locations-server'
import { roundMoney } from '@/lib/trips/pricing'
import { validateHourlyStart } from '@/lib/trips/validation'
import {
  BookingInputError,
  amenityRows,
  assertPartyFits,
  newBookingNumber,
  primaryPassengerRow,
  hourlyBookingSchema,
  requireBookingCustomer,
  verifyAddons,
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

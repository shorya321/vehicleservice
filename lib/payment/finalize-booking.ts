/**
 * Shared booking-payment finalizer.
 *
 * Single idempotent code path used by BOTH:
 *  - the client-initiated confirm route (`app/api/payment/confirm/route.ts`), and
 *  - the Stripe webhook backstop (`app/api/payment/webhook/route.ts`).
 *
 * Guarantees:
 *  - HMAC price-integrity re-verification (skipTtl) when signature fields exist.
 *  - Stripe charged-amount must equal DB `total_price`.
 *  - Booking is marked completed/confirmed only once (idempotent): a booking
 *    already in `payment_status === 'completed'` is a no-op (no duplicate emails).
 */

import { retrievePaymentIntent } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingConfirmationEmail } from '@/lib/email/services/booking-emails'
import { sendNewBookingNotificationEmail } from '@/lib/email/services/admin-emails'
import { getAdminEmail, getAppUrl } from '@/lib/email/config'
import { verifyBookingSignature, verifyPaymentAmount } from '@/lib/security/booking-hmac'
import { convertAmount } from '@/lib/currency/format'
import { BOOKING_TIMEZONE } from '@/lib/utils/timezone'
import type { ExchangeRatesMap } from '@/lib/currency/types'
import type { Database } from '@/lib/supabase/types'

type AdminClient = ReturnType<typeof createAdminClient>
type BookingRow = Database['public']['Tables']['bookings']['Row']

export interface FinalizeBookingParams {
  paymentIntentId: string
  bookingId: string
  /** When set (client-confirm path), booking access is scoped to this customer. Omitted for webhook. */
  expectedCustomerId?: string
  /** Display currency for the confirmation email (from cookie); defaults to AED (webhook backstop). */
  userCurrency?: string
  /** Fallback email (authenticated user) when the primary passenger has none. */
  userEmail?: string
}

export interface FinalizeBookingResult {
  ok: boolean
  status: number
  error?: string
  booking?: unknown
  /** True when the booking was already completed and this call was a no-op. */
  alreadyCompleted?: boolean
}

/**
 * Finalize a booking after a successful Stripe PaymentIntent.
 * Returns a structured result with an HTTP-style status the callers map to a response.
 */
export async function finalizeBookingPayment(
  params: FinalizeBookingParams
): Promise<FinalizeBookingResult> {
  const { paymentIntentId, bookingId, expectedCustomerId, userCurrency = 'AED', userEmail } = params
  const adminClient = createAdminClient()

  // Fetch booking (scoped to customer when called from the authenticated confirm path)
  let query = adminClient.from('bookings').select('*').eq('id', bookingId)
  if (expectedCustomerId) {
    query = query.eq('customer_id', expectedCustomerId)
  }
  const { data: booking, error: fetchError } = await query.single()

  if (fetchError || !booking) {
    return { ok: false, status: 404, error: 'Booking not found' }
  }

  // Idempotency guard: already finalized → no-op (no re-update, no duplicate emails)
  if (booking.payment_status === 'completed') {
    return { ok: true, status: 200, booking, alreadyCompleted: true }
  }

  // Re-verify HMAC signature to ensure booking wasn't tampered
  if (booking.price_signature && booking.price_signature_timestamp && booking.price_signature_nonce) {
    const hmacResult = verifyBookingSignature(
      {
        bookingId: booking.id,
        totalPrice: booking.total_price,
        customerId: booking.customer_id!,
        vehicleTypeId: booking.vehicle_type_id,
        signature: booking.price_signature,
        timestamp: Number(booking.price_signature_timestamp),
        nonce: booking.price_signature_nonce,
      },
      { skipTtl: true }
    )

    if (!hmacResult.valid) {
      console.error('SECURITY ALERT: HMAC re-verification failed at payment finalization', {
        bookingId,
        reason: hmacResult.reason,
      })
      return { ok: false, status: 403, error: 'Booking integrity verification failed' }
    }
  }

  // Retrieve payment intent from Stripe and require success
  const paymentIntent = await retrievePaymentIntent(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    return { ok: false, status: 400, error: 'Payment not completed' }
  }

  // Verify Stripe amount matches DB total_price
  const amountCheck = verifyPaymentAmount(paymentIntent.amount, booking.total_price)
  if (!amountCheck.valid) {
    console.error('SECURITY ALERT: Payment amount mismatch', {
      bookingId,
      reason: amountCheck.reason,
      stripeAmount: paymentIntent.amount,
      dbTotalPrice: booking.total_price,
    })
    return { ok: false, status: 403, error: 'Payment amount verification failed' }
  }

  // Mark booking paid/confirmed
  let updateQuery = adminClient
    .from('bookings')
    .update({
      payment_status: 'completed',
      booking_status: 'confirmed',
      stripe_charge_id: paymentIntent.latest_charge as string,
      paid_at: new Date().toISOString(),
      payment_method_details: {
        type: paymentIntent.payment_method_types[0],
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
  if (expectedCustomerId) {
    updateQuery = updateQuery.eq('customer_id', expectedCustomerId)
  }

  const { data: updatedBooking, error: updateError } = await updateQuery.select().single()

  if (updateError || !updatedBooking) {
    console.error('Failed to update booking:', updateError)
    return { ok: false, status: 500, error: 'Failed to update booking status' }
  }

  // Fire-and-forget confirmation + admin notification emails
  await sendBookingEmails(adminClient, updatedBooking, userCurrency, userEmail)

  return { ok: true, status: 200, booking: updatedBooking }
}

/**
 * Sends the customer confirmation email (currency-converted) and the admin
 * notification email. Errors are swallowed/logged — email failure must never
 * fail a paid booking.
 */
async function sendBookingEmails(
  adminClient: AdminClient,
  updatedBooking: BookingRow,
  userCurrency: string,
  userEmail?: string
): Promise<void> {
  try {
    const bookingId = updatedBooking.id

    const { data: passenger } = await adminClient
      .from('booking_passengers')
      .select('first_name, last_name, email')
      .eq('booking_id', bookingId)
      .eq('is_primary', true)
      .single()

    const { data: vehicleType } = await adminClient
      .from('vehicle_types')
      .select('name, passenger_capacity, luggage_capacity, category:vehicle_categories!category_id(name)')
      .eq('id', updatedBooking.vehicle_type_id)
      .single()

    const [{ data: pickupLocation }, { data: dropoffLocation }] = await Promise.all([
      updatedBooking.from_location_id
        ? adminClient.from('locations').select('name').eq('id', updatedBooking.from_location_id).single()
        : Promise.resolve({ data: null }),
      updatedBooking.to_location_id
        ? adminClient.from('locations').select('name').eq('id', updatedBooking.to_location_id).single()
        : Promise.resolve({ data: null }),
    ])

    const customerName = passenger
      ? `${passenger.first_name} ${passenger.last_name}`
      : 'Customer'
    const customerEmail = passenger?.email || userEmail || ''
    const pickupDatetime = new Date(updatedBooking.pickup_datetime)
    const pickupDate = pickupDatetime.toLocaleDateString('en-US', {
      timeZone: BOOKING_TIMEZONE,
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const pickupTime = pickupDatetime.toLocaleTimeString('en-US', {
      timeZone: BOOKING_TIMEZONE,
      hour: '2-digit', minute: '2-digit',
    })

    const aedAmount = updatedBooking.total_price
    let emailTotalAmount = aedAmount
    let emailCurrency = 'AED'
    let emailOriginalAmount: number | undefined
    let emailOriginalCurrency: string | undefined
    let exchangeRates: ExchangeRatesMap | null = null

    if (userCurrency !== 'AED') {
      const { data: rateRows } = await adminClient
        .from('exchange_rates')
        .select('target_currency, rate')
        .eq('base_currency', 'AED')

      if (rateRows && rateRows.length > 0) {
        const rates: ExchangeRatesMap = { AED: 1.0 }
        for (const row of rateRows) {
          rates[row.target_currency] = parseFloat(String(row.rate))
        }
        exchangeRates = rates

        emailTotalAmount = convertAmount(aedAmount, 'AED', userCurrency, rates)
        emailCurrency = userCurrency
        emailOriginalAmount = aedAmount
        emailOriginalCurrency = 'AED'
      }
    }

    const { data: amenities } = await adminClient
      .from('booking_amenities')
      .select('amenity_type, quantity, price, addon:addons(name)')
      .eq('booking_id', bookingId)

    const amenityLabels: Record<string, string> = {
      child_seat_infant: 'Infant Seat',
      child_seat_booster: 'Booster Seat',
      extra_luggage: 'Extra Luggage',
    }

    const emailExtras = (amenities || []).map((a) => {
      const addonData = a.addon as unknown as { name: string } | null
      const label = a.amenity_type === 'addon' && addonData
        ? addonData.name
        : amenityLabels[a.amenity_type] || a.amenity_type
      return {
        label,
        quantity: a.quantity || 1,
        price: a.price,
      }
    })

    const aedBasePrice = updatedBooking.base_price
    const aedAmenitiesPrice = updatedBooking.amenities_price ?? 0
    let emailBasePrice = aedBasePrice
    let emailAmenitiesPrice = aedAmenitiesPrice
    let convertedExtras = emailExtras

    if (emailCurrency !== 'AED' && exchangeRates) {
      emailBasePrice = convertAmount(aedBasePrice, 'AED', emailCurrency, exchangeRates)
      emailAmenitiesPrice = convertAmount(aedAmenitiesPrice, 'AED', emailCurrency, exchangeRates)
      convertedExtras = emailExtras.map((e) => ({
        ...e,
        price: convertAmount(e.price, 'AED', emailCurrency, exchangeRates!),
      }))
    }

    if (customerEmail) {
      sendBookingConfirmationEmail({
        bookingId: updatedBooking.id,
        customerName,
        customerEmail,
        vehicleCategory: (vehicleType?.category as { name: string } | null)?.name || 'Vehicle',
        vehicleType: vehicleType?.name || undefined,
        passengerCapacity: vehicleType?.passenger_capacity ?? undefined,
        luggageCapacity: vehicleType?.luggage_capacity ?? undefined,
        pickupLocation: pickupLocation?.name || updatedBooking.pickup_address,
        dropoffLocation: dropoffLocation?.name || updatedBooking.dropoff_address,
        pickupDate,
        pickupTime,
        dropoffDate: pickupDate,
        dropoffTime: pickupTime,
        totalAmount: emailTotalAmount,
        currency: emailCurrency,
        bookingReference: updatedBooking.booking_number,
        tripNumber: updatedBooking.trip_number,
        originalAmount: emailOriginalAmount,
        originalCurrency: emailOriginalCurrency,
        passengerCount: updatedBooking.passenger_count,
        adults: updatedBooking.adults,
        children: updatedBooking.children,
        infants: updatedBooking.infants,
        basePrice: emailBasePrice,
        amenitiesPrice: emailAmenitiesPrice,
        extras: convertedExtras,
        customerNotes: updatedBooking.customer_notes ?? undefined,
        invoiceUrl: `${getAppUrl()}/api/booking/${updatedBooking.booking_number}/invoice?currency=${emailCurrency}`,
      }).catch((err) => console.error('Failed to send customer confirmation email:', err))
    }

    const appUrl = getAppUrl()
    sendNewBookingNotificationEmail({
      adminEmail: getAdminEmail(),
      bookingId: updatedBooking.id,
      bookingReference: updatedBooking.booking_number,
      tripNumber: updatedBooking.trip_number,
      customerName,
      customerEmail,
      vehicleCategory: (vehicleType?.category as { name: string } | null)?.name || 'Vehicle',
      vehicleType: vehicleType?.name || undefined,
      pickupLocation: pickupLocation?.name || updatedBooking.pickup_address,
      dropoffLocation: dropoffLocation?.name || updatedBooking.dropoff_address,
      pickupDate,
      pickupTime,
      totalAmount: updatedBooking.total_price,
      currency: 'AED',
      bookingDetailsUrl: `${appUrl}/admin/bookings`,
    }).catch((err) => console.error('Failed to send admin booking notification email:', err))
  } catch (emailError) {
    console.error('Error preparing booking emails:', emailError)
  }
}

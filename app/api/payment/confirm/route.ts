import { NextRequest, NextResponse } from 'next/server'
import { retrievePaymentIntent } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmationEmail } from '@/lib/email/services/booking-emails'
import { sendNewBookingNotificationEmail } from '@/lib/email/services/admin-emails'
import { getAdminEmail, getAppUrl } from '@/lib/email/config'
import { verifyBookingSignature, verifyPaymentAmount } from '@/lib/security/booking-hmac'
import { convertAmount } from '@/lib/currency/format'
import { CURRENCY_COOKIE_NAME, type ExchangeRatesMap } from '@/lib/currency/types'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get request body
    const { paymentIntentId, bookingId } = await request.json()

    if (!paymentIntentId || !bookingId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Fetch booking first to get total_price and signature
    const adminClient = createAdminClient()
    const { data: booking, error: fetchError } = await adminClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Re-verify HMAC signature to ensure booking wasn't tampered
    if (booking.price_signature && booking.price_signature_timestamp && booking.price_signature_nonce) {
      const hmacResult = verifyBookingSignature({
        bookingId: booking.id,
        totalPrice: booking.total_price,
        customerId: booking.customer_id!,
        vehicleTypeId: booking.vehicle_type_id,
        signature: booking.price_signature,
        timestamp: Number(booking.price_signature_timestamp),
        nonce: booking.price_signature_nonce,
      }, { skipTtl: true })

      if (!hmacResult.valid) {
        console.error('SECURITY ALERT: HMAC re-verification failed at payment confirmation', {
          bookingId,
          reason: hmacResult.reason,
        })
        return NextResponse.json(
          { error: 'Booking integrity verification failed' },
          { status: 403 }
        )
      }
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Payment amount verification failed' },
        { status: 403 }
      )
    }

    // Update booking with payment details
    const { data: updatedBooking, error: updateError } = await adminClient
      .from('bookings')
      .update({
        payment_status: 'completed',
        booking_status: 'confirmed',
        stripe_charge_id: paymentIntent.latest_charge as string,
        paid_at: new Date().toISOString(),
        payment_method_details: {
          type: paymentIntent.payment_method_types[0],
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update booking:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      )
    }

    // Send confirmation emails (fire-and-forget)
    try {
      // Fetch passenger details
      const { data: passenger } = await adminClient
        .from('booking_passengers')
        .select('first_name, last_name, email')
        .eq('booking_id', bookingId)
        .eq('is_primary', true)
        .single()

      // Fetch vehicle type with category
      const { data: vehicleType } = await adminClient
        .from('vehicle_types')
        .select('name, passenger_capacity, luggage_capacity, category:vehicle_categories!category_id(name)')
        .eq('id', updatedBooking.vehicle_type_id)
        .single()

      // Fetch location names
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
      const customerEmail = passenger?.email || user.email || ''
      const pickupDatetime = new Date(updatedBooking.pickup_datetime)
      const pickupDate = pickupDatetime.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      const pickupTime = pickupDatetime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
      })
      // Determine user's selected currency from cookie
      const userCurrency = request.cookies.get(CURRENCY_COOKIE_NAME)?.value || 'AED'
      const aedAmount = updatedBooking.total_price

      // Fetch exchange rates for currency conversion
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

      // Fetch booking amenities for price breakdown
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

      // Convert base price, amenities price, and extras to user currency
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

      // Send customer confirmation email
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
          originalAmount: emailOriginalAmount,
          originalCurrency: emailOriginalCurrency,
          passengerCount: updatedBooking.passenger_count,
          basePrice: emailBasePrice,
          amenitiesPrice: emailAmenitiesPrice,
          extras: convertedExtras,
          customerNotes: updatedBooking.customer_notes ?? undefined,
        }).catch((err) => console.error('Failed to send customer confirmation email:', err))
      }

      // Send admin notification email
      const appUrl = getAppUrl()
      sendNewBookingNotificationEmail({
        adminEmail: getAdminEmail(),
        bookingId: updatedBooking.id,
        bookingReference: updatedBooking.booking_number,
        customerName,
        customerEmail,
        vehicleCategory: vehicleType?.name || 'Vehicle',
        pickupLocation: pickupLocation?.name || updatedBooking.pickup_address,
        dropoffLocation: dropoffLocation?.name || updatedBooking.dropoff_address,
        pickupDate,
        totalAmount: updatedBooking.total_price,
        currency: 'AED',
        bookingDetailsUrl: `${appUrl}/admin/bookings`,
      }).catch((err) => console.error('Failed to send admin booking notification email:', err))
    } catch (emailError) {
      console.error('Error preparing booking emails:', emailError)
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking
    })

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

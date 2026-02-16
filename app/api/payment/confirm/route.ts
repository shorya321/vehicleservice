import { NextRequest, NextResponse } from 'next/server'
import { retrievePaymentIntent } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmationEmail } from '@/lib/email/services/booking-emails'
import { sendNewBookingNotificationEmail } from '@/lib/email/services/admin-emails'
import { getAdminEmail, getAppUrl } from '@/lib/email/config'

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

    // Retrieve payment intent from Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Update booking with payment details
    const adminClient = createAdminClient()
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

      // Fetch vehicle type name
      const { data: vehicleType } = await adminClient
        .from('vehicle_types')
        .select('name')
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
      const currency = updatedBooking.currency || 'AED'

      // Send customer confirmation email
      if (customerEmail) {
        sendBookingConfirmationEmail({
          bookingId: updatedBooking.id,
          customerName,
          customerEmail,
          vehicleCategory: vehicleType?.name || 'Vehicle',
          pickupLocation: pickupLocation?.name || updatedBooking.pickup_address,
          dropoffLocation: dropoffLocation?.name || updatedBooking.dropoff_address,
          pickupDate,
          pickupTime,
          dropoffDate: pickupDate,
          dropoffTime: pickupTime,
          totalAmount: updatedBooking.total_price,
          currency,
          bookingReference: updatedBooking.booking_number,
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
        currency,
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
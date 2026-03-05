import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { verifyBookingSignature } from '@/lib/security/booking-hmac'

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

    // Only accept bookingId from client — amount comes from DB
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      )
    }

    // Verify booking exists and belongs to user
    const adminClient = createAdminClient()
    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify HMAC signature to ensure booking integrity
    if (!booking.price_signature || !booking.price_signature_timestamp || !booking.price_signature_nonce) {
      console.error('SECURITY ALERT: Booking missing HMAC signature fields', { bookingId })
      return NextResponse.json(
        { error: 'Booking integrity verification failed' },
        { status: 403 }
      )
    }

    const hmacResult = verifyBookingSignature({
      bookingId: booking.id,
      totalPrice: booking.total_price,
      customerId: booking.customer_id!,
      vehicleTypeId: booking.vehicle_type_id,
      signature: booking.price_signature,
      timestamp: Number(booking.price_signature_timestamp),
      nonce: booking.price_signature_nonce,
    })

    if (!hmacResult.valid) {
      console.error('SECURITY ALERT: HMAC verification failed for booking', {
        bookingId,
        reason: hmacResult.reason,
      })
      return NextResponse.json(
        { error: 'Booking integrity verification failed' },
        { status: 403 }
      )
    }

    // Check if payment already exists
    if (booking.stripe_payment_intent_id) {
      return NextResponse.json({
        clientSecret: booking.stripe_payment_intent_id,
        paymentIntentId: booking.stripe_payment_intent_id
      })
    }

    // Use DB price (not client-sent amount)
    const paymentIntent = await createPaymentIntent(
      booking.total_price,
      bookingId,
      user.email
    )

    // Update booking with payment intent ID
    const { error: updateError } = await adminClient
      .from('bookings')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Failed to update booking with payment intent:', updateError)
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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
    const { bookingId, amount } = await request.json()

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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

    // Check if payment already exists
    if (booking.stripe_payment_intent_id) {
      // Retrieve existing payment intent
      return NextResponse.json({
        clientSecret: booking.stripe_payment_intent_id,
        paymentIntentId: booking.stripe_payment_intent_id
      })
    }

    // Create new payment intent
    const paymentIntent = await createPaymentIntent(
      amount,
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
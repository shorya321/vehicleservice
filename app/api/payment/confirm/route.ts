import { NextRequest, NextResponse } from 'next/server'
import { retrievePaymentIntent } from '@/lib/stripe/server'
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
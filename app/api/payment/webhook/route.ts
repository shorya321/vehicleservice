/**
 * Stripe webhook backstop for the customer booking flow.
 *
 * The happy path finalizes a booking via the client-initiated POST to
 * `/api/payment/confirm`. If the browser closes or the network drops between a
 * successful card charge and that POST, the booking would be left unconfirmed
 * while the card is already charged. This webhook listens for
 * `payment_intent.succeeded` and runs the SAME idempotent finalizer so the
 * booking is always confirmed even when the client never calls back.
 *
 * Idempotency: `finalizeBookingPayment` no-ops when the booking is already
 * `completed`, so a webhook that races the client-confirm never double-updates
 * or double-emails.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe, webhookSecret } from '@/lib/stripe/server'
import { finalizeBookingPayment } from '@/lib/payment/finalize-booking'

/**
 * Signing secret for THIS endpoint. Stripe issues a separate secret per webhook
 * endpoint. If the booking webhook is registered as its own Stripe endpoint
 * (separate from the wallet webhook), set STRIPE_BOOKING_WEBHOOK_SECRET.
 * Falls back to STRIPE_WEBHOOK_SECRET for single-endpoint setups.
 */
const bookingWebhookSecret = process.env.STRIPE_BOOKING_WEBHOOK_SECRET || webhookSecret

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('Stripe not configured — payment webhook cannot run')
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  if (!bookingWebhookSecret) {
    console.error('Booking webhook secret not configured — cannot verify signatures')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Raw body + signature header are required for signature verification
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, bookingWebhookSecret)
  } catch (err) {
    console.error('Payment webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const bookingId = paymentIntent.metadata?.bookingId

      // Only booking PaymentIntents carry a bookingId; ignore others (e.g. wallet)
      if (bookingId) {
        const result = await finalizeBookingPayment({
          paymentIntentId: paymentIntent.id,
          bookingId,
          // No authenticated user in webhook context; AED email fallback.
          userCurrency: 'AED',
        })

        if (!result.ok) {
          console.error('Payment webhook: finalize failed', {
            bookingId,
            status: result.status,
            error: result.error,
          })
        }
      }
    }
  } catch (err) {
    // Never surface a 500 for a verified event we simply failed to process —
    // Stripe would retry, but the finalizer is idempotent so that is safe.
    console.error('Payment webhook processing error:', err)
  }

  // Always ack a verified event
  return NextResponse.json({ received: true })
}

/**
 * Stripe Webhook Handler for Wallet Recharge
 * Processes payment confirmation and adds credits to wallet
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@/lib/business/api-utils';
import { savePaymentMethod } from '../_lib/save-payment-method';
import { sendCreditEmail } from '../_lib/send-credit-email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Symmetric with app/api/payment/webhook/route.ts, which reads
// STRIPE_BOOKING_WEBHOOK_SECRET and falls back to STRIPE_WEBHOOK_SECRET. Without the
// same fallback shape here, an operator who registers two destinations and sets only
// STRIPE_WEBHOOK_SECRET (to the booking endpoint's secret) gets a wallet endpoint that
// fails signature verification forever, with no symptom other than uncredited wallets.
const webhookSecret = process.env.STRIPE_WALLET_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/business/wallet/webhook
 * Handle Stripe webhook events for payment confirmation
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return apiError('Missing stripe-signature header', 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return apiError('Webhook signature verification failed', 400);
  }

  console.log('Wallet webhook received:', { eventId: event.id, type: event.type });

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract metadata
    const businessAccountId = session.metadata?.business_account_id;
    // Credit the actually-charged total (fils -> AED), not client-supplied metadata.
    const amount = (session.amount_total ?? 0) / 100;
    const metadataAmount = parseFloat(session.metadata?.amount || '0');
    if (metadataAmount && Math.abs(metadataAmount - amount) > 0.01) {
      console.warn('Webhook: metadata.amount diverges from amount_total', {
        sessionId: session.id,
        metadataAmount,
        amountTotal: amount,
      });
    }
    const paymentIntentId = session.payment_intent as string;

    // Not a wallet top-up. Answering 4xx here marks a delivery failure on a perfectly
    // valid event, and Stripe disables a destination that keeps failing - taking the
    // wallet credits down with it. Acknowledge and move on, the same contract as
    // app/api/payment/webhook/route.ts.
    if (!businessAccountId) {
      console.log('Wallet webhook: ignoring session without business_account_id', {
        eventId: event.id,
        sessionId: session.id,
      });
      return apiSuccess({ message: 'Event ignored: not a wallet payment' });
    }

    // Our event, but unusable. 400 is right: retrying will not help.
    if (!amount) {
      console.error('Missing amount in Stripe session:', session.metadata);
      return apiError('Invalid session metadata', 400);
    }

    // Always 'paid' while the flow is card-only, so this changes nothing today. It stops
    // an async payment method (added later at the Stripe end, with no code change here)
    // from crediting a session whose money has not actually arrived.
    if (session.payment_status !== 'paid') {
      console.log('Wallet webhook: session not paid yet, skipping credit', {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
      return apiSuccess({ message: 'Event ignored: session not paid' });
    }

    // Use admin client to add credits
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    try {
      // Check for idempotency - prevent duplicate processing
      const { data: existingTransaction } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (existingTransaction) {
        console.log('Transaction already processed:', paymentIntentId);
        return apiSuccess({ message: 'Transaction already processed' });
      }

      // Add credits to wallet using atomic function
      const { data, error } = await supabaseAdmin.rpc('add_to_wallet', {
        p_business_id: businessAccountId,
        p_amount: amount,
        p_transaction_type: 'credit_added',
        p_description: `Wallet recharge via Stripe ($${amount.toFixed(2)})`,
        p_created_by: 'stripe_webhook',
        p_reference_id: null,
        p_stripe_payment_intent_id: paymentIntentId,
      });

      if (error) {
        console.error('Failed to add credits to wallet:', error);
        return apiError('Failed to add credits', 500);
      }

      console.log('Credits added successfully:', {
        businessAccountId,
        amount,
        newBalance: data,
      });

      // Save payment method if available (for future recharges)
      try {
        // Checkout sessions may have payment_method directly
        const paymentMethodId = session.payment_method as string;

        if (paymentMethodId) {
          await savePaymentMethod(
            stripe,
            supabaseAdmin,
            businessAccountId,
            paymentMethodId
          );
        } else {
          console.log('No payment method found in checkout session');
        }
      } catch (pmError) {
        console.error('Failed to save payment method (non-critical):', pmError);
        // Don't fail the webhook if payment method saving fails
      }

      // Send transaction completed email notification
      try {
        await sendCreditEmail(supabaseAdmin, businessAccountId, paymentIntentId, 'Wallet recharge via Stripe');
      } catch (emailError) {
        console.error('Failed to send transaction email:', emailError);
        // Don't fail the webhook if email fails
      }

      return apiSuccess({ message: 'Credits added successfully', new_balance: data });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return apiError('Failed to process payment', 500);
    }
  }

  // Handle payment_intent.succeeded event (Payment Element)
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Extract metadata
    const businessAccountId = paymentIntent.metadata?.business_account_id;
    const amount = paymentIntent.amount / 100; // Convert cents to dollars
    const paymentIntentId = paymentIntent.id;

    // Every customer booking payment also emits payment_intent.succeeded, and this
    // destination is subscribed to it. Those PaymentIntents carry metadata.bookingId,
    // not business_account_id. Failing them marks this destination as broken and Stripe
    // eventually disables it. Acknowledge instead - see the equivalent guard in
    // app/api/payment/webhook/route.ts, which ignores wallet PaymentIntents the same way.
    if (!businessAccountId) {
      console.log('Wallet webhook: ignoring PaymentIntent without business_account_id', {
        eventId: event.id,
        paymentIntentId,
      });
      return apiSuccess({ message: 'Event ignored: not a wallet payment' });
    }

    // Our event, but unusable. 400 is right: retrying will not help.
    if (!amount) {
      console.error('Missing amount in PaymentIntent:', paymentIntent.metadata);
      return apiError('Invalid PaymentIntent metadata', 400);
    }

    // Use admin client to add credits
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    try {
      // Check for idempotency - prevent duplicate processing
      const { data: existingTransaction } = await supabaseAdmin
        .from('wallet_transactions')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (existingTransaction) {
        console.log('PaymentIntent already processed:', paymentIntentId);
        return apiSuccess({ message: 'Transaction already processed' });
      }

      // Add credits to wallet using atomic function
      const { data, error } = await supabaseAdmin.rpc('add_to_wallet', {
        p_business_id: businessAccountId,
        p_amount: amount,
        p_transaction_type: 'credit_added',
        p_description: `Wallet recharge via Payment Element ($${amount.toFixed(2)})`,
        p_created_by: 'stripe_webhook',
        p_reference_id: null,
        p_stripe_payment_intent_id: paymentIntentId,
      });

      if (error) {
        console.error('Failed to add credits to wallet:', error);
        return apiError('Failed to add credits', 500);
      }

      console.log('Credits added successfully (Payment Element):', {
        businessAccountId,
        amount,
        newBalance: data,
      });

      // Save payment method if available (for future recharges)
      try {
        // PaymentIntents have payment_method field
        const paymentMethodId = paymentIntent.payment_method as string;

        if (paymentMethodId) {
          await savePaymentMethod(
            stripe,
            supabaseAdmin,
            businessAccountId,
            paymentMethodId
          );
        }
      } catch (pmError) {
        console.error('Failed to save payment method (non-critical):', pmError);
        // Don't fail the webhook if payment method saving fails
      }

      // Send transaction completed email notification
      try {
        await sendCreditEmail(supabaseAdmin, businessAccountId, paymentIntentId, 'Wallet recharge via Payment Element');
      } catch (emailError) {
        console.error('Failed to send transaction email:', emailError);
        // Don't fail the webhook if email fails
      }

      return apiSuccess({ message: 'Credits added successfully', new_balance: data });
    } catch (error) {
      console.error('PaymentIntent webhook processing error:', error);
      return apiError('Failed to process payment', 500);
    }
  }

  // Return success for other event types we don't handle
  return apiSuccess({ message: 'Event received' });
}

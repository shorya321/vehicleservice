/**
 * Stripe Webhook Handler for Wallet Recharge
 * Processes payment confirmation and adds credits to wallet
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { apiSuccess, apiError } from '@/lib/business/api-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract metadata
    const businessAccountId = session.metadata?.business_account_id;
    const amount = parseFloat(session.metadata?.amount || '0');
    const paymentIntentId = session.payment_intent as string;

    if (!businessAccountId || !amount) {
      console.error('Missing metadata in Stripe session:', session.metadata);
      return apiError('Invalid session metadata', 400);
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

      return apiSuccess({ message: 'Credits added successfully', new_balance: data });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return apiError('Failed to process payment', 500);
    }
  }

  // Return success for other event types we don't handle
  return apiSuccess({ message: 'Event received' });
}

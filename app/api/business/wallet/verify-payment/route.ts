/**
 * Payment Verification API
 * Verifies Stripe Checkout payment and credits wallet
 * Used for client-side verification when webhooks can't reach localhost
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * GET /api/business/wallet/verify-payment?session_id=xxx
 * Verify checkout session and credit wallet
 */
export const GET = requireBusinessAuth(async (request: NextRequest, user) => {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return apiError('Missing session_id parameter', 400);
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return apiError('Session not found', 404);
    }

    // Verify session belongs to this business
    const businessAccountId = session.metadata?.business_account_id;
    if (businessAccountId !== user.businessAccountId) {
      return apiError('Unauthorized', 403);
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return apiError('Payment not completed', 400);
    }

    // Extract payment details
    const amount = parseFloat(session.metadata?.amount || '0');
    const paymentIntentId = session.payment_intent as string;

    if (!amount) {
      return apiError('Invalid payment amount', 400);
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

    // Check for idempotency - prevent duplicate processing
    const { data: existingTransaction } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id, balance_after')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (existingTransaction) {
      console.log('Payment already processed:', paymentIntentId);
      return apiSuccess({
        message: 'Payment already processed',
        new_balance: existingTransaction.balance_after,
        already_processed: true,
      });
    }

    // Add credits to wallet using atomic function
    const { data: newBalance, error } = await supabaseAdmin.rpc('add_to_wallet', {
      p_business_id: businessAccountId,
      p_amount: amount,
      p_transaction_type: 'credit_added',
      p_description: `Wallet recharge via Stripe Checkout ($${amount.toFixed(2)})`,
      p_created_by: 'client_verification',
      p_reference_id: null,
      p_stripe_payment_intent_id: paymentIntentId,
    });

    if (error) {
      console.error('Failed to add credits to wallet:', error);
      return apiError('Failed to add credits', 500);
    }

    console.log('Credits added successfully (client verification):', {
      businessAccountId,
      amount,
      newBalance,
    });

    return apiSuccess({
      message: 'Payment verified and wallet credited',
      new_balance: newBalance,
      amount_added: amount,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return apiError(error.message, 400);
    }
    return apiError('Failed to verify payment', 500);
  }
});

/**
 * Payment Element - Charge Saved Payment Method
 * Charges a previously saved payment method for wallet recharge
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Validation schema
const chargeSavedSchema = z.object({
  payment_method_id: z.string().min(1, 'Payment method ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

/**
 * POST /api/business/wallet/payment-element/charge-saved
 * Charge a saved payment method for wallet recharge
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, chargeSavedSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  const { payment_method_id, amount } = body;

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Get business account details
    const { data: businessAccount, error: accountError } = await supabase
      .from('business_accounts')
      .select(
        'id, business_name, business_email, stripe_customer_id, preferred_currency'
      )
      .eq('id', user.businessAccountId)
      .single();

    if (accountError || !businessAccount) {
      console.error('Error fetching business account:', accountError);
      return apiError('Failed to fetch business account', 500);
    }

    // Verify customer ID exists
    if (!businessAccount.stripe_customer_id) {
      return apiError('No Stripe customer found for this business', 400);
    }

    // Verify payment method belongs to this business
    const { data: savedPM, error: pmError } = await supabase
      .from('payment_methods')
      .select('id, stripe_payment_method_id, is_active')
      .eq('id', payment_method_id)
      .eq('business_account_id', user.businessAccountId)
      .eq('is_active', true)
      .single();

    if (pmError || !savedPM) {
      return apiError('Payment method not found or inactive', 404);
    }

    // Determine currency
    const currency = businessAccount.preferred_currency || 'usd';

    // Create and confirm PaymentIntent with saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: businessAccount.stripe_customer_id,
      payment_method: savedPM.stripe_payment_method_id,
      confirm: true, // Confirm immediately
      off_session: true, // Allow off-session payments
      metadata: {
        business_account_id: user.businessAccountId,
        business_user_id: user.businessId,
        transaction_type: 'credit_added',
        payment_method_type: 'saved',
      },
      description: `Wallet recharge for ${businessAccount.business_name} (saved card)`,
    });

    // Update last_used_at for this payment method
    await supabase
      .from('payment_methods')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', payment_method_id);

    // Check payment status
    if (paymentIntent.status === 'succeeded') {
      return apiSuccess({
        message: 'Payment successful',
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount,
        currency: currency.toUpperCase(),
      });
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure or similar action required
      return apiSuccess({
        message: 'Additional authentication required',
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        requires_action: true,
      });
    } else {
      return apiError(`Payment ${paymentIntent.status}`, 400);
    }
  } catch (error) {
    console.error('Saved card charge error:', error);

    if (error instanceof Stripe.errors.StripeCardError) {
      // Card declined or similar
      return apiError(error.message, 400);
    } else if (error instanceof Stripe.errors.StripeError) {
      return apiError(error.message, 400);
    }

    return apiError('Failed to process payment', 500);
  }
});

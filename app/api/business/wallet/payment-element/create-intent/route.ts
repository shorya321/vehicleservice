/**
 * Payment Element - Create Payment Intent
 * Creates a Stripe PaymentIntent for wallet recharge with Payment Element
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import {
  requireBusinessAuth,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { walletRechargeSchema } from '@/lib/business/validators';
import {
  getOrCreateBusinessStripeCustomer,
  formatBusinessDetails,
} from '@/lib/stripe/business-customer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * POST /api/business/wallet/payment-element/create-intent
 * Create PaymentIntent for wallet recharge using Payment Element
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, walletRechargeSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  const { amount } = body;

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Get business account details
    const { data: businessAccount, error: accountError } = await supabase
      .from('business_accounts')
      .select(
        'id, business_name, business_email, business_phone, address, city, country_code, preferred_currency, payment_element_enabled'
      )
      .eq('id', user.businessAccountId)
      .single();

    if (accountError || !businessAccount) {
      console.error('Error fetching business account:', accountError);
      return apiError('Failed to fetch business account', 500);
    }

    // Check if Payment Element is enabled
    if (!businessAccount.payment_element_enabled) {
      return apiError('Payment Element is not enabled for this business', 403);
    }

    // Determine currency
    const currency = businessAccount.preferred_currency || 'aed';

    // Get or create Stripe customer for this business
    // This ensures payment methods can be reused instead of creating duplicates
    const customerId = await getOrCreateBusinessStripeCustomer(
      user.businessAccountId,
      formatBusinessDetails(businessAccount)
    );

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId, // Attach to customer to enable payment method reuse
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Embedded flow only
      },
      metadata: {
        business_account_id: user.businessAccountId,
        business_user_id: user.businessId,
        transaction_type: 'credit_added',
      },
      description: `Wallet recharge for ${businessAccount.business_name}`,
      setup_future_usage: 'off_session', // Allow saving payment method
    });

    return apiSuccess({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount,
      currency: currency.toUpperCase(),
    });
  } catch (error) {
    console.error('PaymentIntent creation error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return apiError(error.message, 400);
    }
    return apiError('Failed to create payment intent', 500);
  }
});

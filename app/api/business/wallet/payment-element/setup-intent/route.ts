/**
 * Payment Element - Setup Intent
 * Creates a Stripe SetupIntent for saving payment methods without charging
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { requireBusinessAuth, apiSuccess, apiError } from '@/lib/business/api-utils';
import {
  getOrCreateBusinessStripeCustomer,
  formatBusinessDetails,
} from '@/lib/stripe/business-customer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * POST /api/business/wallet/payment-element/setup-intent
 * Create SetupIntent for saving payment method without immediate charge
 */
export const POST = requireBusinessAuth(async (request: NextRequest, user) => {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // Get business account details
    const { data: businessAccount, error: accountError } = await supabase
      .from('business_accounts')
      .select(
        'id, business_name, business_email, business_phone, address, city, country_code, payment_element_enabled, save_payment_methods'
      )
      .eq('id', user.businessAccountId)
      .single();

    if (accountError || !businessAccount) {
      console.error('Error fetching business account:', accountError);
      return apiError('Failed to fetch business account', 500);
    }

    // Check if Payment Element and saving payment methods is enabled
    if (!businessAccount.payment_element_enabled) {
      return apiError('Payment Element is not enabled for this business', 403);
    }

    if (!businessAccount.save_payment_methods) {
      return apiError('Saving payment methods is not enabled for this business', 403);
    }

    // Get or create Stripe customer for this business
    // This ensures payment methods can be reused instead of creating duplicates
    const customerId = await getOrCreateBusinessStripeCustomer(
      user.businessAccountId,
      formatBusinessDetails(businessAccount)
    );

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId, // Attach to customer to enable payment method reuse
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Embedded flow only
      },
      metadata: {
        business_account_id: user.businessAccountId,
        business_user_id: user.businessId,
        purpose: 'save_payment_method',
      },
      usage: 'off_session', // Allow future off-session payments
    });

    return apiSuccess({
      client_secret: setupIntent.client_secret,
      setup_intent_id: setupIntent.id,
    });
  } catch (error) {
    console.error('SetupIntent creation error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return apiError(error.message, 400);
    }
    return apiError('Failed to create setup intent', 500);
  }
});

/**
 * Stripe Checkout API for Wallet Recharge
 * Creates a Stripe Checkout session for adding credits
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import {
  requireBusinessOwner,
  apiSuccess,
  apiError,
  parseRequestBody,
} from '@/lib/business/api-utils';
import { walletRechargeSchema } from '@/lib/business/validators';
import { resolveTenantOrigin } from '@/lib/business/tenant-origin';
import {
  getOrCreateBusinessStripeCustomer,
  formatBusinessDetails,
} from '@/lib/stripe/business-customer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * POST /api/business/wallet/checkout
 * Create Stripe Checkout session for wallet recharge
 */
export const POST = requireBusinessOwner(async (request: NextRequest, user) => {
  // Parse and validate request body
  const body = await parseRequestBody(request, walletRechargeSchema);

  if (!body) {
    return apiError('Invalid request body', 400);
  }

  const { amount, origin: clientOrigin } = body;

  try {
    // Get business account details
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // subdomain / custom_domain / custom_domain_verified ride along on the query that was
    // already being made; they feed resolveTenantOrigin below.
    const { data: businessAccount } = await supabase
      .from('business_accounts')
      .select('id, business_name, business_email, business_phone, address, city, country_code, subdomain, custom_domain, custom_domain_verified')
      .eq('id', user.businessAccountId)
      .single();

    if (!businessAccount) {
      // Without this, a null falls into formatBusinessDetails and surfaces as an opaque
      // 500 from the catch below.
      return apiError('Business account not found', 404);
    }

    // Get or create Stripe customer for this business
    // This ensures payment methods can be reused instead of creating duplicates
    const customerId = await getOrCreateBusinessStripeCustomer(
      user.businessAccountId,
      formatBusinessDetails(businessAccount)
    );

    // Supabase auth cookies are host-only (lib/supabase/server.ts never sets a `domain`),
    // so a payer who started on their own subdomain or custom domain has no session on
    // the platform host. Send them back to the exact origin they left from, or they
    // return signed out and proxy.ts redirects them to /business/login with the
    // session_id gone. Validated against this tenant's own domains, never echoed.
    const returnOrigin = resolveTenantOrigin(
      request,
      {
        subdomain: businessAccount.subdomain,
        customDomain: businessAccount.custom_domain,
        customDomainVerified: businessAccount.custom_domain_verified,
      },
      clientOrigin
    );

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Attach to customer to enable payment method reuse
      payment_method_types: ['card'],
      mode: 'payment' as const,
      line_items: [
        {
          price_data: {
            currency: 'aed',
            product_data: {
              name: 'Wallet Recharge',
              description: `Add ${amount.toFixed(2)} AED to your business wallet`,
            },
            unit_amount: Math.round(amount * 100), // Convert to fils
          },
          quantity: 1,
        },
      ],
      metadata: {
        business_account_id: user.businessAccountId,
        business_user_id: user.businessId,
        amount: amount.toString(),
        transaction_type: 'credit_added',
      },
      success_url: `${returnOrigin}/business/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnOrigin}/business/wallet?cancelled=true`,
    });

    return apiSuccess({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return apiError('Failed to create checkout session', 500);
  }
});

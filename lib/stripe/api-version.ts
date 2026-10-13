import type Stripe from 'stripe'

/**
 * The one Stripe API version every server client uses (customer bookings,
 * business wallet, webhooks). Matches the installed stripe SDK's pinned
 * version, so its types describe the responses we get back.
 */
export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-07-30.basil'

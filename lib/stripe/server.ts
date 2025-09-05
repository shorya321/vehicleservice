import Stripe from 'stripe'

// Check if Stripe keys are configured
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.warn('⚠️ Stripe Secret Key not configured. Payment processing will not work.')
  console.warn('Please add STRIPE_SECRET_KEY to your .env.local file')
}

// Initialize Stripe with secret key (or dummy key for development)
export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null as any

// Webhook secret for verifying Stripe events
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Create or retrieve a Stripe customer
export async function createOrRetrieveStripeCustomer(
  userId: string,
  email: string,
  name?: string,
  phone?: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  // Check if user already has a Stripe customer ID
  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    // Verify customer still exists in Stripe
    try {
      await stripe.customers.retrieve(profile.stripe_customer_id)
      return profile.stripe_customer_id
    } catch (error) {
      // Customer doesn't exist in Stripe, create new one
      console.log('Stripe customer not found, creating new one')
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    phone: phone || undefined,
    metadata: {
      supabase_user_id: userId
    }
  })

  // Save customer ID to profile
  await adminClient
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

// Create a PaymentIntent with customer
export async function createPaymentIntent(
  amount: number,
  bookingId: string,
  customerId?: string,
  customerEmail?: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.')
  }

  const params: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      bookingId,
    },
  }

  if (customerId) {
    params.customer = customerId
  }

  if (customerEmail) {
    params.receipt_email = customerEmail
  }

  const paymentIntent = await stripe.paymentIntents.create(params)
  return paymentIntent
}

// Retrieve a PaymentIntent
export async function retrievePaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

// Cancel a PaymentIntent
export async function cancelPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.cancel(paymentIntentId)
}

// Create a refund
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
) {
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason: reason || 'requested_by_customer',
  }

  if (amount) {
    params.amount = Math.round(amount * 100) // Convert to cents
  }

  return await stripe.refunds.create(params)
}
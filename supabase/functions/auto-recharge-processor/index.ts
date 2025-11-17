/**
 * Auto-Recharge Processor Edge Function
 *
 * Processes automatic wallet recharge requests with retry logic
 *
 * Features:
 * - Idempotent processing using attempt IDs
 * - Retry logic with exponential backoff
 * - Off-session payments with saved payment methods
 * - Stripe Connect support
 * - Comprehensive error handling and logging
 *
 * Triggers:
 * - HTTP POST request with attempt_id
 * - Scheduled cron job for pending retries
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18',
  httpClient: Stripe.createFetchHttpClient(),
})

// Initialize Supabase Admin Client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Send email notification using our API endpoint
 */
async function sendEmailNotification(
  notificationType: string,
  businessAccountId: string,
  emailData: Record<string, any>
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl.replace('.supabase.co', '')}/api/internal/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        notification_type: notificationType,
        business_account_id: businessAccountId,
        email_data: emailData,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[Email] Failed to send ${notificationType} notification:`, error)
    } else {
      console.log(`[Email] ${notificationType} notification sent successfully`)
    }
  } catch (error) {
    console.error(`[Email] Error sending ${notificationType} notification:`, error)
    // Don't throw - email failures shouldn't fail the main process
  }
}

interface AutoRechargeAttempt {
  id: string
  business_account_id: string
  trigger_balance: number
  requested_amount: number
  currency: string
  payment_method_id: string | null
  idempotency_key: string
  retry_count: number
  max_retries: number
  stripe_payment_intent_id?: string
}

interface BusinessAccount {
  id: string
  business_name: string
  stripe_connected_account_id?: string
  stripe_connect_enabled: boolean
}

/**
 * Process a single auto-recharge attempt
 */
async function processAutoRechargeAttempt(attemptId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[Auto-Recharge] Processing attempt: ${attemptId}`)

  try {
    // 1. Fetch attempt details
    const { data: attempt, error: fetchError } = await supabase
      .from('auto_recharge_attempts')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (fetchError || !attempt) {
      throw new Error(`Failed to fetch attempt: ${fetchError?.message || 'Not found'}`)
    }

    const typedAttempt = attempt as AutoRechargeAttempt

    // Skip if already processed
    if (typedAttempt.stripe_payment_intent_id && ['succeeded', 'cancelled'].includes(attempt.status)) {
      console.log(`[Auto-Recharge] Attempt ${attemptId} already processed with status: ${attempt.status}`)
      return { success: true }
    }

    // Update status to processing
    await supabase
      .from('auto_recharge_attempts')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', attemptId)

    // 2. Fetch business account details
    const { data: businessAccount, error: accountError } = await supabase
      .from('business_accounts')
      .select('id, business_name, stripe_connected_account_id, stripe_connect_enabled')
      .eq('id', typedAttempt.business_account_id)
      .single()

    if (accountError || !businessAccount) {
      throw new Error(`Failed to fetch business account: ${accountError?.message || 'Not found'}`)
    }

    const typedAccount = businessAccount as BusinessAccount

    // 3. Get payment method details
    if (!typedAttempt.payment_method_id) {
      throw new Error('No payment method specified for auto-recharge')
    }

    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('stripe_payment_method_id, is_active')
      .eq('id', typedAttempt.payment_method_id)
      .single()

    if (pmError || !paymentMethod) {
      throw new Error(`Failed to fetch payment method: ${pmError?.message || 'Not found'}`)
    }

    if (!paymentMethod.is_active) {
      throw new Error('Payment method is inactive')
    }

    // 4. Prepare Stripe request options for connected account
    const stripeOptions: Stripe.RequestOptions = typedAccount.stripe_connect_enabled && typedAccount.stripe_connected_account_id
      ? { stripeAccount: typedAccount.stripe_connected_account_id }
      : {}

    // 5. Create or retrieve PaymentIntent
    let paymentIntent: Stripe.PaymentIntent

    if (typedAttempt.stripe_payment_intent_id) {
      // Retrieve existing PaymentIntent
      console.log(`[Auto-Recharge] Retrieving existing PaymentIntent: ${typedAttempt.stripe_payment_intent_id}`)
      paymentIntent = await stripe.paymentIntents.retrieve(
        typedAttempt.stripe_payment_intent_id,
        stripeOptions
      )
    } else {
      // Create new PaymentIntent
      console.log(`[Auto-Recharge] Creating PaymentIntent for ${typedAttempt.requested_amount} ${typedAttempt.currency}`)

      const amount = Math.round(typedAttempt.requested_amount * 100) // Convert to cents

      paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: typedAttempt.currency.toLowerCase(),
          payment_method: paymentMethod.stripe_payment_method_id,
          customer: typedAccount.stripe_connected_account_id, // Optional: link to customer
          confirm: true, // Immediately confirm the payment
          off_session: true, // Allow off-session payment
          metadata: {
            business_account_id: typedAttempt.business_account_id,
            auto_recharge_attempt_id: attemptId,
            idempotency_key: typedAttempt.idempotency_key,
            type: 'auto_recharge',
          },
        },
        {
          ...stripeOptions,
          idempotencyKey: typedAttempt.idempotency_key, // Ensure idempotency
        }
      )

      // Update attempt with PaymentIntent ID
      await supabase
        .from('auto_recharge_attempts')
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq('id', attemptId)

      console.log(`[Auto-Recharge] PaymentIntent created: ${paymentIntent.id}, status: ${paymentIntent.status}`)
    }

    // 6. Handle PaymentIntent status
    if (paymentIntent.status === 'succeeded') {
      // Payment successful - add funds to wallet
      console.log(`[Auto-Recharge] Payment succeeded, adding funds to wallet`)

      const actualAmount = paymentIntent.amount / 100 // Convert from cents

      // Add wallet transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          business_account_id: typedAttempt.business_account_id,
          amount: actualAmount,
          transaction_type: 'credit_added',
          description: `Auto-recharge: ${actualAmount} ${typedAttempt.currency}`,
          payment_intent_id: paymentIntent.id,
          currency: typedAttempt.currency,
          metadata: {
            auto_recharge_attempt_id: attemptId,
            trigger_balance: typedAttempt.trigger_balance,
          },
        })
        .select('id')
        .single()

      if (transactionError) {
        console.error(`[Auto-Recharge] Failed to create wallet transaction:`, transactionError)
        throw new Error(`Failed to add funds to wallet: ${transactionError.message}`)
      }

      // Update business account balance
      const { error: balanceError } = await supabase.rpc('add_to_wallet', {
        p_business_account_id: typedAttempt.business_account_id,
        p_amount: actualAmount,
      })

      if (balanceError) {
        console.error(`[Auto-Recharge] Failed to update balance:`, balanceError)
        // Transaction exists but balance not updated - needs manual intervention
        throw new Error(`Failed to update wallet balance: ${balanceError.message}`)
      }

      // Update attempt status to succeeded
      await supabase
        .from('auto_recharge_attempts')
        .update({
          status: 'succeeded',
          actual_recharged_amount: actualAmount,
          wallet_transaction_id: transaction.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId)

      console.log(`[Auto-Recharge] ✅ Auto-recharge completed successfully for attempt ${attemptId}`)

      // Send success email notification
      await sendEmailNotification('auto_recharge_success', typedAttempt.business_account_id, {
        rechargeAmount: actualAmount,
        currency: typedAttempt.currency,
        paymentMethod: paymentMethod.stripe_payment_method_id.substring(0, 20),
        rechargeDate: new Date(),
        rechargeId: attemptId,
      })

      return { success: true }
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_action') {
      // Payment method failed or requires additional action
      const errorMsg = paymentIntent.last_payment_error?.message || 'Payment method declined or requires action'
      console.error(`[Auto-Recharge] Payment failed:`, errorMsg)

      // Increment retry count
      await supabase.rpc('increment_auto_recharge_retry', {
        p_attempt_id: attemptId,
        p_error_message: errorMsg,
      })

      throw new Error(errorMsg)
    } else if (paymentIntent.status === 'processing') {
      // Payment is still processing - check back later
      console.log(`[Auto-Recharge] Payment processing, will check later`)
      return { success: false, error: 'Payment still processing' }
    } else {
      // Unexpected status
      throw new Error(`Unexpected PaymentIntent status: ${paymentIntent.status}`)
    }
  } catch (error) {
    console.error(`[Auto-Recharge] Error processing attempt ${attemptId}:`, error)

    // Determine if this is a retryable error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isRetryable =
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('rate_limit') ||
      errorMessage.includes('api_error')

    if (isRetryable) {
      // Increment retry count for retryable errors
      await supabase.rpc('increment_auto_recharge_retry', {
        p_attempt_id: attemptId,
        p_error_message: errorMessage,
      })
    } else {
      // Mark as failed for non-retryable errors
      await supabase.rpc('update_auto_recharge_attempt_status', {
        p_attempt_id: attemptId,
        p_status: 'failed',
        p_error_message: errorMessage,
        p_error_code: error instanceof Stripe.errors.StripeError ? error.code : 'unknown',
      })

      // Send failure email notification
      const { data: failedAttempt } = await supabase
        .from('auto_recharge_attempts')
        .select('business_account_id, requested_amount, currency')
        .eq('id', attemptId)
        .single()

      if (failedAttempt) {
        await sendEmailNotification('auto_recharge_failed', failedAttempt.business_account_id, {
          attemptedAmount: failedAttempt.requested_amount,
          currency: failedAttempt.currency,
          failureReason: errorMessage,
          attemptDate: new Date(),
        })
      }
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * Process pending retry attempts (called by cron)
 */
async function processPendingRetries(): Promise<{ processed: number; succeeded: number; failed: number }> {
  console.log(`[Auto-Recharge] Processing pending retries...`)

  // Fetch pending attempts ready for retry
  const { data: pendingAttempts, error } = await supabase
    .from('auto_recharge_attempts')
    .select('id')
    .eq('status', 'pending')
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(10) // Process up to 10 at a time

  if (error) {
    console.error(`[Auto-Recharge] Error fetching pending retries:`, error)
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  if (!pendingAttempts || pendingAttempts.length === 0) {
    console.log(`[Auto-Recharge] No pending retries found`)
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  console.log(`[Auto-Recharge] Found ${pendingAttempts.length} pending retries`)

  let succeeded = 0
  let failed = 0

  // Process each attempt sequentially
  for (const attempt of pendingAttempts) {
    const result = await processAutoRechargeAttempt(attempt.id)
    if (result.success) {
      succeeded++
    } else {
      failed++
    }
  }

  return { processed: pendingAttempts.length, succeeded, failed }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!authHeader || !authHeader.includes(anonKey!)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname

    // Route: Process specific attempt
    if (path === '/auto-recharge-processor' && req.method === 'POST') {
      const { attempt_id } = await req.json()

      if (!attempt_id) {
        return new Response(
          JSON.stringify({ error: 'Missing attempt_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const result = await processAutoRechargeAttempt(attempt_id)

      return new Response(
        JSON.stringify(result),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Route: Process pending retries (cron job)
    if (path === '/auto-recharge-processor/retries' && req.method === 'GET') {
      const stats = await processPendingRetries()

      return new Response(
        JSON.stringify(stats),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Unknown route
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Auto-Recharge] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

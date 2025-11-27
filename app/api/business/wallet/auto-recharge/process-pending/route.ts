/**
 * Auto-Recharge Processor API
 * Processes pending auto-recharge attempts
 *
 * This endpoint can be called:
 * - Manually by admin
 * - By scheduled cron job (every minute)
 * - On wallet page load (check for pending)
 *
 * Returns: { processed, succeeded, failed } statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

interface AutoRechargeAttempt {
  id: string;
  business_account_id: string;
  trigger_balance: number;
  requested_amount: number;
  currency: string;
  payment_method_id: string | null;
  idempotency_key: string;
  retry_count: number;
  max_retries: number;
  stripe_payment_intent_id?: string;
  status: string;
}

interface BusinessAccount {
  id: string;
  business_name: string;
  stripe_customer_id?: string;
}

/**
 * Process a single auto-recharge attempt
 */
async function processAttempt(
  attempt: AutoRechargeAttempt,
  supabaseAdmin: ReturnType<typeof createAdminClient>
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Auto-Recharge] Processing attempt: ${attempt.id}`);

  try {
    // Skip if already processed
    if (
      attempt.stripe_payment_intent_id &&
      ['succeeded', 'cancelled'].includes(attempt.status)
    ) {
      console.log(
        `[Auto-Recharge] Attempt ${attempt.id} already processed: ${attempt.status}`
      );
      return { success: true };
    }

    // Update status to processing
    await supabaseAdmin
      .from('auto_recharge_attempts')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', attempt.id);

    // Fetch business account
    const { data: businessAccount, error: accountError } = await supabaseAdmin
      .from('business_accounts')
      .select('id, business_name, stripe_customer_id')
      .eq('id', attempt.business_account_id)
      .single();

    if (accountError || !businessAccount) {
      throw new Error(
        `Failed to fetch business account: ${accountError?.message || 'Not found'}`
      );
    }

    const typedAccount = businessAccount as BusinessAccount;

    // Verify customer ID exists
    if (!typedAccount.stripe_customer_id) {
      throw new Error('No Stripe customer ID found for this business');
    }

    // Get payment method
    if (!attempt.payment_method_id) {
      throw new Error('No payment method specified for auto-recharge');
    }

    const { data: paymentMethod, error: pmError } = await supabaseAdmin
      .from('payment_methods')
      .select('stripe_payment_method_id, is_active')
      .eq('id', attempt.payment_method_id)
      .single();

    if (pmError || !paymentMethod) {
      throw new Error(
        `Failed to fetch payment method: ${pmError?.message || 'Not found'}`
      );
    }

    if (!paymentMethod.is_active) {
      throw new Error('Payment method is inactive');
    }

    // Create or retrieve PaymentIntent
    let paymentIntent: Stripe.PaymentIntent;

    if (attempt.stripe_payment_intent_id) {
      // Retrieve existing PaymentIntent
      console.log(
        `[Auto-Recharge] Retrieving PaymentIntent: ${attempt.stripe_payment_intent_id}`
      );
      paymentIntent = await stripe.paymentIntents.retrieve(
        attempt.stripe_payment_intent_id
      );
    } else {
      // Create new PaymentIntent
      console.log(
        `[Auto-Recharge] Creating PaymentIntent for ${attempt.requested_amount} ${attempt.currency}`
      );

      const amount = Math.round(attempt.requested_amount * 100); // Convert to cents

      paymentIntent = await stripe.paymentIntents.create(
        {
          amount,
          currency: attempt.currency.toLowerCase(),
          payment_method: paymentMethod.stripe_payment_method_id,
          customer: typedAccount.stripe_customer_id,
          confirm: true, // Immediately confirm
          off_session: true, // Allow off-session payment
          metadata: {
            business_account_id: attempt.business_account_id,
            auto_recharge_attempt_id: attempt.id,
            idempotency_key: attempt.idempotency_key,
            type: 'auto_recharge',
          },
        },
        {
          idempotencyKey: attempt.idempotency_key,
        }
      );

      // Update attempt with PaymentIntent ID
      await supabaseAdmin
        .from('auto_recharge_attempts')
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq('id', attempt.id);

      console.log(
        `[Auto-Recharge] PaymentIntent created: ${paymentIntent.id}, status: ${paymentIntent.status}`
      );
    }

    // Handle PaymentIntent status
    if (paymentIntent.status === 'succeeded') {
      // Payment successful - add funds to wallet
      console.log(`[Auto-Recharge] Payment succeeded, adding funds to wallet`);

      const actualAmount = paymentIntent.amount / 100; // Convert from cents

      // Add credits to wallet using atomic function (creates transaction + updates balance)
      const { data, error: walletError } = await supabaseAdmin.rpc('add_to_wallet', {
        p_business_id: attempt.business_account_id,
        p_amount: actualAmount,
        p_transaction_type: 'credit_added',
        p_description: `Auto-recharge: ${actualAmount} ${attempt.currency}`,
        p_created_by: 'auto_recharge',
        p_reference_id: null,
        p_stripe_payment_intent_id: paymentIntent.id,
      });

      if (walletError) {
        console.error(`[Auto-Recharge] Failed to add funds to wallet:`, walletError);
        throw new Error(`Failed to add funds to wallet: ${walletError.message}`);
      }

      // Get the created transaction ID from the function result
      const transactionId = data as string;

      // Update attempt status to succeeded
      await supabaseAdmin
        .from('auto_recharge_attempts')
        .update({
          status: 'succeeded',
          actual_recharged_amount: actualAmount,
          wallet_transaction_id: transactionId,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', attempt.id);

      console.log(
        `[Auto-Recharge] ✅ Auto-recharge completed successfully for attempt ${attempt.id}`
      );

      // Get business owner's auth_user_id for in-app notification
      const { data: ownerUser } = await supabaseAdmin
        .from('business_users')
        .select('auth_user_id')
        .eq('business_account_id', attempt.business_account_id)
        .eq('role', 'owner')
        .single();

      // Get payment method display name
      const { data: pmDetails } = await supabaseAdmin
        .from('payment_methods')
        .select('card_brand, card_last_four')
        .eq('id', attempt.payment_method_id)
        .single();

      const paymentMethodDisplay = pmDetails
        ? `${pmDetails.card_brand} •••• ${pmDetails.card_last_four}`
        : 'Default payment method';

      // Get previous balance (before recharge)
      const previousBalance = (typedAccount as any).wallet_balance || 0;

      // Send in-app notification
      if (ownerUser?.auth_user_id) {
        await supabaseAdmin.rpc('create_business_notification', {
          p_business_user_auth_id: ownerUser.auth_user_id,
          p_category: 'payment',
          p_type: 'auto_recharge_success',
          p_title: 'Auto-Recharge Successful',
          p_message: `Your wallet has been recharged with ${actualAmount} ${attempt.currency}. New balance: ${previousBalance + actualAmount} ${attempt.currency}`,
          p_data: {
            amount: actualAmount,
            currency: attempt.currency,
            payment_method: paymentMethodDisplay,
            transaction_id: transactionId,
            attempt_id: attempt.id,
          },
          p_link: '/business/wallet',
        });
      }

      // Send email notification via internal API
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            notification_type: 'auto_recharge_success',
            business_account_id: attempt.business_account_id,
            email_data: {
              rechargeAmount: actualAmount,
              previousBalance,
              newBalance: previousBalance + actualAmount,
              paymentMethod: paymentMethodDisplay,
              rechargeDate: new Date().toISOString(),
              rechargeId: attempt.id,
            },
          }),
        });
      } catch (emailError) {
        console.error('[Auto-Recharge] Failed to send success email:', emailError);
        // Don't fail the recharge if email fails
      }

      return { success: true };
    } else if (
      paymentIntent.status === 'requires_payment_method' ||
      paymentIntent.status === 'requires_action'
    ) {
      // Payment failed or requires action
      const errorMsg =
        paymentIntent.last_payment_error?.message ||
        'Payment method declined or requires action';
      console.error(`[Auto-Recharge] Payment failed:`, errorMsg);

      // Increment retry count
      await supabaseAdmin.rpc('increment_auto_recharge_retry', {
        p_attempt_id: attempt.id,
        p_error_message: errorMsg,
      });

      throw new Error(errorMsg);
    } else if (paymentIntent.status === 'processing') {
      // Payment still processing
      console.log(`[Auto-Recharge] Payment processing, will check later`);
      return { success: false, error: 'Payment still processing' };
    } else {
      throw new Error(`Unexpected PaymentIntent status: ${paymentIntent.status}`);
    }
  } catch (error) {
    console.error(`[Auto-Recharge] Error processing attempt ${attempt.id}:`, error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRetryable =
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('rate_limit') ||
      errorMessage.includes('api_error');

    if (isRetryable) {
      // Increment retry count for retryable errors
      await supabaseAdmin.rpc('increment_auto_recharge_retry', {
        p_attempt_id: attempt.id,
        p_error_message: errorMessage,
      });
    } else {
      // Mark as failed for non-retryable errors
      await supabaseAdmin.rpc('update_auto_recharge_attempt_status', {
        p_attempt_id: attempt.id,
        p_status: 'failed',
        p_error_message: errorMessage,
        p_error_code:
          error instanceof Stripe.errors.StripeError ? error.code : 'unknown',
      });

      // Send failed notification (both in-app and email)
      try {
        // Get business owner's auth_user_id for in-app notification
        const { data: ownerUser } = await supabaseAdmin
          .from('business_users')
          .select('auth_user_id')
          .eq('business_account_id', attempt.business_account_id)
          .eq('role', 'owner')
          .single();

        // Get payment method display name
        const { data: pmDetails } = await supabaseAdmin
          .from('payment_methods')
          .select('card_brand, card_last_four')
          .eq('id', attempt.payment_method_id)
          .single();

        const paymentMethodDisplay = pmDetails
          ? `${pmDetails.card_brand} •••• ${pmDetails.card_last_four}`
          : 'Default payment method';

        // Send in-app notification
        if (ownerUser?.auth_user_id) {
          await supabaseAdmin.rpc('create_business_notification', {
            p_business_user_auth_id: ownerUser.auth_user_id,
            p_category: 'payment',
            p_type: 'auto_recharge_failed',
            p_title: 'Auto-Recharge Failed',
            p_message: `Auto-recharge of ${attempt.requested_amount} ${attempt.currency} failed: ${errorMessage}`,
            p_data: {
              amount: attempt.requested_amount,
              currency: attempt.currency,
              payment_method: paymentMethodDisplay,
              error_message: errorMessage,
              attempt_id: attempt.id,
            },
            p_link: '/business/wallet/settings',
          });
        }

        // Send email notification via internal API
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            notification_type: 'auto_recharge_failed',
            business_account_id: attempt.business_account_id,
            email_data: {
              attemptedAmount: attempt.requested_amount,
              paymentMethod: paymentMethodDisplay,
              failureReason: errorMessage,
              attemptDate: new Date().toISOString(),
            },
          }),
        });
      } catch (notifyError) {
        console.error('[Auto-Recharge] Failed to send failure notification:', notifyError);
        // Don't fail the operation if notification fails
      }
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * GET /api/business/wallet/auto-recharge/process-pending
 * Process all pending auto-recharge attempts
 */
export async function GET(request: NextRequest) {
  console.log(`[Auto-Recharge] Processing pending attempts...`);

  try {
    const supabaseAdmin = createAdminClient();

    // Fetch pending attempts ready for retry
    const { data: pendingAttempts, error } = await supabaseAdmin
      .from('auto_recharge_attempts')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(10); // Process up to 10 at a time

    if (error) {
      console.error(`[Auto-Recharge] Error fetching pending retries:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch pending attempts', details: error.message },
        { status: 500 }
      );
    }

    if (!pendingAttempts || pendingAttempts.length === 0) {
      console.log(`[Auto-Recharge] No pending retries found`);
      return NextResponse.json({
        message: 'No pending attempts',
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    }

    console.log(`[Auto-Recharge] Found ${pendingAttempts.length} pending attempts`);

    let succeeded = 0;
    let failed = 0;

    // Process each attempt sequentially
    for (const attempt of pendingAttempts) {
      const result = await processAttempt(
        attempt as AutoRechargeAttempt,
        supabaseAdmin
      );
      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      message: 'Processing complete',
      processed: pendingAttempts.length,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error('[Auto-Recharge] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/wallet/auto-recharge/process-pending
 * Process specific attempt by ID (for testing)
 */
export async function POST(request: NextRequest) {
  try {
    const { attempt_id } = await request.json();

    if (!attempt_id) {
      return NextResponse.json(
        { error: 'Missing attempt_id' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Fetch specific attempt
    const { data: attempt, error: fetchError } = await supabaseAdmin
      .from('auto_recharge_attempts')
      .select('*')
      .eq('id', attempt_id)
      .single();

    if (fetchError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    const result = await processAttempt(
      attempt as AutoRechargeAttempt,
      supabaseAdmin
    );

    if (result.success) {
      return NextResponse.json({
        message: 'Processing successful',
        attempt_id,
      });
    } else {
      return NextResponse.json(
        {
          error: 'Processing failed',
          attempt_id,
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Auto-Recharge] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

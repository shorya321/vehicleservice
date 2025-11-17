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
 * Helper function to save payment method after successful payment
 * Extracts payment method from Stripe and saves to database
 */
async function savePaymentMethod(
  stripe: Stripe,
  supabaseAdmin: any,
  businessAccountId: string,
  paymentMethodId: string
): Promise<void> {
  try {
    // Check if business allows saving payment methods
    const { data: businessAccount } = await supabaseAdmin
      .from('business_accounts')
      .select('save_payment_methods')
      .eq('id', businessAccountId)
      .single();

    if (!businessAccount?.save_payment_methods) {
      console.log('Saving payment methods disabled for business:', businessAccountId);
      return;
    }

    // Check if payment method already exists (including soft-deleted ones)
    // Use array query to handle duplicates gracefully (not .single())
    const { data: existingPMs, error: checkError } = await supabaseAdmin
      .from('payment_methods')
      .select('id, is_active, last_used_at, card_last4, card_brand, created_at')
      .eq('stripe_payment_method_id', paymentMethodId)
      .eq('business_account_id', businessAccountId)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (existingPMs && existingPMs.length > 0) {
      // Find active PM or use most recently used
      const activePM = existingPMs.find(pm => pm.is_active);
      const existingPM = activePM || existingPMs[0];

      // Reactivate/update the chosen PM
      await supabaseAdmin
        .from('payment_methods')
        .update({
          is_active: true, // Reactivate if was soft-deleted
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingPM.id);

      // If multiple duplicates exist, deactivate the others
      if (existingPMs.length > 1) {
        const otherIds = existingPMs
          .filter(pm => pm.id !== existingPM.id)
          .map(pm => pm.id);

        if (otherIds.length > 0) {
          await supabaseAdmin
            .from('payment_methods')
            .update({ is_active: false })
            .in('id', otherIds);
        }
      }

      return;
    }

    // Retrieve payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Extract card details if it's a card
    const cardDetails: Record<string, any> = {};
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      cardDetails.card_brand = paymentMethod.card.brand;
      cardDetails.card_last4 = paymentMethod.card.last4;
      cardDetails.card_exp_month = paymentMethod.card.exp_month;
      cardDetails.card_exp_year = paymentMethod.card.exp_year;
      cardDetails.card_funding = paymentMethod.card.funding;
    }

    // Check if this is the first payment method (should be default)
    const { data: existingMethods } = await supabaseAdmin
      .from('payment_methods')
      .select('id')
      .eq('business_account_id', businessAccountId)
      .eq('is_active', true);

    const isFirstMethod = !existingMethods || existingMethods.length === 0;

    // Save to database
    const insertData = {
      business_account_id: businessAccountId,
      stripe_payment_method_id: paymentMethodId,
      payment_method_type: paymentMethod.type,
      ...cardDetails,
      billing_email: paymentMethod.billing_details?.email,
      billing_name: paymentMethod.billing_details?.name,
      billing_country: paymentMethod.billing_details?.address?.country,
      is_default: isFirstMethod, // First payment method becomes default
      is_active: true,
      last_used_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseAdmin
      .from('payment_methods')
      .insert(insertData);

    if (insertError) {
      console.error('Error saving payment method:', insertError);
      return;
    }
  } catch (error) {
    console.error('Error in savePaymentMethod:', error);
    // Don't throw - we don't want to fail the webhook if payment method saving fails
  }
}

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

      // Save payment method if available (for future auto-recharge)
      try {
        // Checkout sessions may have payment_method directly
        const paymentMethodId = session.payment_method as string;

        if (paymentMethodId) {
          await savePaymentMethod(
            stripe,
            supabaseAdmin,
            businessAccountId,
            paymentMethodId
          );
        } else {
          console.log('No payment method found in checkout session');
        }
      } catch (pmError) {
        console.error('Failed to save payment method (non-critical):', pmError);
        // Don't fail the webhook if payment method saving fails
      }

      // Send transaction completed email notification
      try {
        // Get the created transaction for email
        const { data: transaction } = await supabaseAdmin
          .from('wallet_transactions')
          .select('id, amount, balance_after, created_at')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (transaction) {
          // Calculate previous balance
          const previousBalance = transaction.balance_after - transaction.amount;

          // Send email via internal API
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              notification_type: 'transaction_completed',
              business_account_id: businessAccountId,
              email_data: {
                transactionType: 'credit',
                amount: transaction.amount,
                description: `Wallet recharge via Stripe`,
                previousBalance,
                newBalance: transaction.balance_after,
                transactionDate: transaction.created_at,
                transactionId: transaction.id,
              },
            }),
          });
        }
      } catch (emailError) {
        console.error('Failed to send transaction email:', emailError);
        // Don't fail the webhook if email fails
      }

      return apiSuccess({ message: 'Credits added successfully', new_balance: data });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return apiError('Failed to process payment', 500);
    }
  }

  // Handle payment_intent.succeeded event (Payment Element)
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // Extract metadata
    const businessAccountId = paymentIntent.metadata?.business_account_id;
    const amount = paymentIntent.amount / 100; // Convert cents to dollars
    const paymentIntentId = paymentIntent.id;

    if (!businessAccountId || !amount) {
      console.error('Missing metadata in PaymentIntent:', paymentIntent.metadata);
      return apiError('Invalid PaymentIntent metadata', 400);
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
        console.log('PaymentIntent already processed:', paymentIntentId);
        return apiSuccess({ message: 'Transaction already processed' });
      }

      // Add credits to wallet using atomic function
      const { data, error } = await supabaseAdmin.rpc('add_to_wallet', {
        p_business_id: businessAccountId,
        p_amount: amount,
        p_transaction_type: 'credit_added',
        p_description: `Wallet recharge via Payment Element ($${amount.toFixed(2)})`,
        p_created_by: 'stripe_webhook',
        p_reference_id: null,
        p_stripe_payment_intent_id: paymentIntentId,
      });

      if (error) {
        console.error('Failed to add credits to wallet:', error);
        return apiError('Failed to add credits', 500);
      }

      console.log('Credits added successfully (Payment Element):', {
        businessAccountId,
        amount,
        newBalance: data,
      });

      // Save payment method if available (for future auto-recharge)
      try {
        // PaymentIntents have payment_method field
        const paymentMethodId = paymentIntent.payment_method as string;

        if (paymentMethodId) {
          await savePaymentMethod(
            stripe,
            supabaseAdmin,
            businessAccountId,
            paymentMethodId
          );
        }
      } catch (pmError) {
        console.error('Failed to save payment method (non-critical):', pmError);
        // Don't fail the webhook if payment method saving fails
      }

      // Send transaction completed email notification
      try {
        // Get the created transaction for email
        const { data: transaction } = await supabaseAdmin
          .from('wallet_transactions')
          .select('id, amount, balance_after, created_at')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (transaction) {
          // Calculate previous balance
          const previousBalance = transaction.balance_after - transaction.amount;

          // Send email via internal API
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              notification_type: 'transaction_completed',
              business_account_id: businessAccountId,
              email_data: {
                transactionType: 'credit',
                amount: transaction.amount,
                description: `Wallet recharge via Payment Element`,
                previousBalance,
                newBalance: transaction.balance_after,
                transactionDate: transaction.created_at,
                transactionId: transaction.id,
              },
            }),
          });
        }
      } catch (emailError) {
        console.error('Failed to send transaction email:', emailError);
        // Don't fail the webhook if email fails
      }

      return apiSuccess({ message: 'Credits added successfully', new_balance: data });
    } catch (error) {
      console.error('PaymentIntent webhook processing error:', error);
      return apiError('Failed to process payment', 500);
    }
  }

  // Return success for other event types we don't handle
  return apiSuccess({ message: 'Event received' });
}

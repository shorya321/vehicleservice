/**
 * PaymentIntent Verification API
 * Backup crediting for Payment Element and saved-card top-ups, mirroring what
 * verify-payment does for Stripe Checkout.
 *
 * The webhook stays primary: it also saves the card and sends the credit email, and it
 * returns early once a wallet_transactions row exists. So this route only credits after a
 * grace period (lib/business/wallet/intent-credit-check.ts), and when it does, it saves the
 * card and sends the email itself. add_to_wallet's unique index on
 * stripe_payment_intent_id makes a race with the webhook a no-op, never a double credit.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { requireBusinessOwner, apiSuccess, apiError } from '@/lib/business/api-utils';
import { walletIntentVerifySchema } from '@/lib/business/validators';
import { checkWalletIntent } from '@/lib/business/wallet/intent-credit-check';
import { savePaymentMethod } from '../_lib/save-payment-method';
import { sendCreditEmail } from '../_lib/send-credit-email';

// Pinned to the same API version as every other wallet route, so the PaymentIntent shape
// matches what the webhook sees. The installed SDK types only name its own latest version.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

const CREATED_BY = 'client_verification';

/**
 * GET /api/business/wallet/verify-intent?payment_intent_id=pi_xxx
 * Returns { credited, pending?, new_balance? }
 */
export const GET = requireBusinessOwner(async (request: Request, user) => {
  const { searchParams } = new URL(request.url);
  const parsed = walletIntentVerifySchema.safeParse({
    payment_intent_id: searchParams.get('payment_intent_id'),
  });

  if (!parsed.success) {
    return apiError('Invalid payment_intent_id parameter', 400);
  }

  const paymentIntentId = parsed.data.payment_intent_id;

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
    // Normal case: the webhook already credited it. Scoped to this business so a
    // foreign intent id never reveals another tenant's balance.
    const { data: existing } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id, balance_after')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('business_account_id', user.businessAccountId)
      .maybeSingle();

    if (existing) {
      return apiSuccess({ credited: true, new_balance: existing.balance_after });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    });

    const check = checkWalletIntent(
      paymentIntent,
      user.businessAccountId,
      Math.floor(Date.now() / 1000)
    );

    if (check.kind === 'forbidden') {
      return apiError('Unauthorized', 403);
    }
    if (check.kind === 'not_paid') {
      return apiError('Payment not completed', 400);
    }
    if (check.kind === 'wait') {
      return apiSuccess({ credited: false, pending: true });
    }

    const { data: newBalance, error } = await supabaseAdmin.rpc('add_to_wallet', {
      p_business_id: user.businessAccountId,
      p_amount: check.amount,
      p_transaction_type: 'credit_added',
      p_description: `Wallet recharge via Payment Element ($${check.amount.toFixed(2)})`,
      p_created_by: CREATED_BY,
      p_reference_id: null,
      p_stripe_payment_intent_id: paymentIntentId,
    });

    if (error) {
      console.error('verify-intent: failed to add credits to wallet:', error);
      return apiError('Failed to add credits', 500);
    }

    // add_to_wallet is a no-op when the webhook got there first. Only the call that
    // actually inserted the row does the webhook's follow-up work, so nothing repeats.
    const { data: transaction } = await supabaseAdmin
      .from('wallet_transactions')
      .select('created_by, balance_after')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (transaction?.created_by === CREATED_BY) {
      console.log('Credits added by verify-intent (webhook not yet received):', {
        businessAccountId: user.businessAccountId,
        paymentIntentId,
        amount: check.amount,
        newBalance,
      });

      const paymentMethodId =
        typeof paymentIntent.payment_method === 'string'
          ? paymentIntent.payment_method
          : paymentIntent.payment_method?.id;

      if (paymentMethodId) {
        try {
          await savePaymentMethod(stripe, supabaseAdmin, user.businessAccountId, paymentMethodId);
        } catch (pmError) {
          console.error('verify-intent: failed to save payment method (non-critical):', pmError);
        }
      }

      try {
        await sendCreditEmail(
          supabaseAdmin,
          user.businessAccountId,
          paymentIntentId,
          'Wallet recharge via Payment Element'
        );
      } catch (emailError) {
        console.error('verify-intent: failed to send transaction email:', emailError);
      }
    }

    return apiSuccess({
      credited: true,
      new_balance: transaction?.balance_after ?? newBalance,
    });
  } catch (error) {
    console.error('PaymentIntent verification error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return apiError(error.message, 400);
    }
    return apiError('Failed to verify payment', 500);
  }
});

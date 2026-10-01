/**
 * Decides whether the wallet's backup path may credit a PaymentIntent top-up.
 *
 * The Stripe webhook stays the primary crediting path: besides crediting, it saves the
 * card and sends the credit email, and it returns early once a wallet_transactions row
 * exists. A backup that credited at once would always win that race and quietly stop both.
 * So the backup only credits after a grace period, measured from the charge. The intent's
 * own `created` is no use: Payment Element creates it before the card is even typed.
 */

import type Stripe from 'stripe';

export const WALLET_INTENT_GRACE_SECONDS = 20;

export type WalletIntentCheck =
  | { kind: 'forbidden' }
  | { kind: 'not_paid' }
  | { kind: 'wait' }
  | { kind: 'credit'; amount: number };

export function checkWalletIntent(
  paymentIntent: Stripe.PaymentIntent,
  businessAccountId: string,
  nowSeconds: number,
  graceSeconds: number = WALLET_INTENT_GRACE_SECONDS,
): WalletIntentCheck {
  if (paymentIntent.metadata?.business_account_id !== businessAccountId) {
    return { kind: 'forbidden' };
  }

  if (paymentIntent.status !== 'succeeded' || !(paymentIntent.amount_received > 0)) {
    return { kind: 'not_paid' };
  }

  // Unexpanded (a bare id) or missing: the age is unknown, so leave it to the webhook.
  const charge = paymentIntent.latest_charge;
  if (!charge || typeof charge === 'string') {
    return { kind: 'wait' };
  }

  if (nowSeconds - charge.created < graceSeconds) {
    return { kind: 'wait' };
  }

  // Fils to AED: the charged total, never a client-supplied amount.
  return { kind: 'credit', amount: paymentIntent.amount_received / 100 };
}

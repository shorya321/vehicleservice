/**
 * Sends the "transaction completed" email for a wallet credit tied to a PaymentIntent.
 *
 * Moved verbatim out of app/api/business/wallet/webhook/route.ts (it was duplicated there
 * for Checkout and Payment Element, differing only in the description) so the
 * verify-intent backup path sends the same email when it credits ahead of a late webhook.
 * Throws on failure; callers keep their own try/catch so an email never fails a credit.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getAppUrl } from '@/lib/email/config';

export async function sendCreditEmail(
  supabaseAdmin: SupabaseClient,
  businessAccountId: string,
  paymentIntentId: string,
  description: string
): Promise<void> {
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
    // getAppUrl(), not the bare env var: unset, `${process.env.NEXT_PUBLIC_APP_URL}`
    // interpolates to the string "undefined" and fetch throws on the URL, which the
    // caller's catch then swallows.
    //
    // Keep this absolute and pinned to the platform origin. /api/internal/* is
    // outside the custom-domain allowlist in lib/business/domain-routing.ts, so a
    // relative URL would be answered with a 307 to /business/login by proxy.ts and
    // fail as a 200 with an HTML body.
    await fetch(`${getAppUrl()}/api/internal/send-notification`, {
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
          description,
          previousBalance,
          newBalance: transaction.balance_after,
          transactionDate: transaction.created_at,
          transactionId: transaction.id,
        },
      }),
    });
  }
}

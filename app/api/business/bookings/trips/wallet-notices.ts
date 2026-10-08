/**
 * Wallet side effects of a business trip booking: the spending-limit notice when the wallet
 * refuses, and the low-balance alert after a successful charge.
 * SCOPE: Business module ONLY. Same behaviour as the one-way route (../route.ts), kept as its own
 * copy so that route stays untouched.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAppUrl } from '@/lib/email/config';

/**
 * Absolute and pinned to the platform origin: /api/internal/* is outside the custom-domain
 * allowlist, so a relative URL would be redirected to /business/login by proxy.ts.
 */
async function postInternalNotice(body: Record<string, unknown>): Promise<void> {
  await fetch(`${getAppUrl()}/api/internal/send-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

async function ownerAuthId(supabase: SupabaseClient, businessAccountId: string): Promise<string | null> {
  const { data } = await supabase
    .from('business_users')
    .select('auth_user_id')
    .eq('business_account_id', businessAccountId)
    .eq('role', 'owner')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  return (data?.auth_user_id as string | null | undefined) ?? null;
}

export async function noticeSpendingLimit(
  supabase: SupabaseClient,
  businessAccountId: string,
  isDailyLimit: boolean,
  rejectedAmount: number
): Promise<void> {
  try {
    const limitType = isDailyLimit ? 'daily' : 'monthly';
    const [ownerId, { data: account }] = await Promise.all([
      ownerAuthId(supabase, businessAccountId),
      supabase
        .from('business_accounts')
        .select('max_daily_spend, max_monthly_spend, currency')
        .eq('id', businessAccountId)
        .single(),
    ]);
    const limitAmount = isDailyLimit ? account?.max_daily_spend : account?.max_monthly_spend;
    const currency = account?.currency || 'AED';

    if (ownerId) {
      await supabase.rpc('create_business_notification', {
        p_business_user_auth_id: ownerId,
        p_category: 'payment',
        p_type: 'spending_limit_reached',
        p_title: `${isDailyLimit ? 'Daily' : 'Monthly'} Spending Limit Reached`,
        p_message: `Your ${limitType} spending limit of ${limitAmount} ${currency} has been reached. Transaction rejected.`,
        p_data: { limit_type: limitType, limit_amount: limitAmount, rejected_amount: rejectedAmount, currency },
        p_link: '/business/wallet/settings',
      });
    }

    await postInternalNotice({
      notification_type: 'spending_limit_reached',
      business_account_id: businessAccountId,
      email_data: {
        limitType,
        limitAmount,
        currentSpend: limitAmount,
        rejectedTransactionAmount: rejectedAmount,
      },
    });
  } catch (error) {
    console.error('Failed to send spending limit notification:', error);
  }
}

export async function noticeLowBalance(supabase: SupabaseClient, businessAccountId: string): Promise<void> {
  try {
    const { data: account } = await supabase
      .from('business_accounts')
      .select('wallet_balance, currency, notification_preferences')
      .eq('id', businessAccountId)
      .single();
    if (!account) return;

    const config = (account.notification_preferences || {}).low_balance_alert;
    if (config?.enabled === false) return;
    const threshold = config?.threshold || 100;
    if (account.wallet_balance > threshold) return;

    const ownerId = await ownerAuthId(supabase, businessAccountId);
    if (ownerId) {
      await supabase.rpc('create_business_notification', {
        p_business_user_auth_id: ownerId,
        p_category: 'payment',
        p_type: 'low_balance_alert',
        p_title: 'Low Wallet Balance',
        p_message: `Your wallet balance is ${account.wallet_balance} ${account.currency || 'AED'}. Consider adding funds to avoid service interruption.`,
        p_data: { current_balance: account.wallet_balance, threshold, currency: account.currency || 'AED' },
        p_link: '/business/wallet',
      });
    }

    await postInternalNotice({
      notification_type: 'low_balance_alert',
      business_account_id: businessAccountId,
      email_data: { threshold },
    });
  } catch (error) {
    console.error('Failed to send low balance alert:', error);
  }
}

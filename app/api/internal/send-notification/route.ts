/**
 * Internal Notification Sender API
 * Used by Edge Functions and internal services to send email notifications
 * NOT exposed to public - requires service role key
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/business/api-utils';
import {
  sendAutoRechargeSuccessEmail,
  sendAutoRechargeFailedEmail,
  sendTransactionCompletedEmail,
  sendLowBalanceAlert,
  sendWalletFrozenEmail,
  sendSpendingLimitReachedEmail,
} from '@/lib/email/services/wallet-emails';

/**
 * POST: Send email notification
 */
export async function POST(request: NextRequest) {
  try {
    // Verify service role authorization
    const authHeader = request.headers.get('Authorization');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authHeader || !authHeader.includes(serviceKey!)) {
      return apiError('Unauthorized - Service role required', 401);
    }

    // Parse request body
    const body = await request.json();
    const { notification_type, business_account_id, email_data } = body;

    if (!notification_type || !business_account_id) {
      return apiError('Missing required fields: notification_type, business_account_id', 400);
    }

    // Get business account details
    const supabase = createAdminClient();
    const { data: businessAccount, error: accountError } = await supabase
      .from('business_accounts')
      .select('id, business_name, business_email, business_phone, business_address, currency, wallet_balance, notification_preferences')
      .eq('id', business_account_id)
      .single();

    if (accountError || !businessAccount) {
      return apiError('Business account not found', 404);
    }

    // Check if notification is enabled in preferences
    const preferences = businessAccount.notification_preferences || {};
    const notificationConfig = preferences[notification_type];

    if (notificationConfig && notificationConfig.enabled === false) {
      console.log(`[Notification] ${notification_type} disabled for business ${business_account_id}`);
      return apiSuccess({ message: 'Notification disabled in preferences', sent: false });
    }

    // Prepare common email data
    const baseEmailData = {
      businessName: businessAccount.business_name,
      businessEmail: businessAccount.business_email,
      businessPhone: businessAccount.business_phone,
      businessAddress: businessAccount.business_address,
      currency: businessAccount.currency || 'AED',
      walletUrl: `${process.env.NEXT_PUBLIC_APP_URL}/business/wallet`,
      ...email_data,
    };

    // Send appropriate email based on notification type
    let emailResult;

    switch (notification_type) {
      case 'auto_recharge_success':
        emailResult = await sendAutoRechargeSuccessEmail({
          ...baseEmailData,
          previousBalance: baseEmailData.previousBalance || businessAccount.wallet_balance - baseEmailData.rechargeAmount,
          newBalance: baseEmailData.newBalance || businessAccount.wallet_balance,
        });
        break;

      case 'auto_recharge_failed':
        emailResult = await sendAutoRechargeFailedEmail({
          ...baseEmailData,
          currentBalance: businessAccount.wallet_balance,
          paymentMethod: baseEmailData.paymentMethod || 'Default payment method',
          walletUrl: baseEmailData.walletUrl,
        });
        break;

      case 'transaction_completed':
        emailResult = await sendTransactionCompletedEmail({
          ...baseEmailData,
          transactionType: baseEmailData.transactionType || 'credit',
          amount: baseEmailData.amount,
          description: baseEmailData.description || 'Wallet transaction',
          previousBalance: baseEmailData.previousBalance,
          newBalance: baseEmailData.newBalance,
          transactionDate: baseEmailData.transactionDate ? new Date(baseEmailData.transactionDate) : new Date(),
          transactionId: baseEmailData.transactionId,
        });
        break;

      case 'low_balance_alert':
        emailResult = await sendLowBalanceAlert({
          ...baseEmailData,
          currentBalance: businessAccount.wallet_balance,
          threshold: baseEmailData.threshold || notificationConfig?.threshold || 100,
        });
        break;

      case 'wallet_frozen':
        emailResult = await sendWalletFrozenEmail({
          ...baseEmailData,
          currentBalance: businessAccount.wallet_balance,
          freezeReason: baseEmailData.freezeReason || 'Administrative action',
          frozenBy: baseEmailData.frozenBy || 'System',
          freezeDate: baseEmailData.freezeDate ? new Date(baseEmailData.freezeDate) : new Date(),
          supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        });
        break;

      case 'spending_limit_reached':
        emailResult = await sendSpendingLimitReachedEmail({
          ...baseEmailData,
          limitType: baseEmailData.limitType || 'daily',
          limitAmount: baseEmailData.limitAmount,
          currentSpend: baseEmailData.currentSpend,
          rejectedTransactionAmount: baseEmailData.rejectedTransactionAmount,
          resetDate: baseEmailData.resetDate ? new Date(baseEmailData.resetDate) : undefined,
          supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        });
        break;

      default:
        return apiError(`Unknown notification type: ${notification_type}`, 400);
    }

    // Record notification in history
    await supabase.from('wallet_notification_history').insert({
      business_account_id,
      notification_type,
      status: emailResult.success ? 'sent' : 'failed',
      email_id: emailResult.emailId,
      error_message: emailResult.error,
      metadata: email_data,
    });

    if (!emailResult.success) {
      return apiError(`Failed to send email: ${emailResult.error}`, 500);
    }

    return apiSuccess({
      message: 'Notification sent successfully',
      sent: true,
      email_id: emailResult.emailId,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return apiError('Failed to send notification', 500);
  }
}

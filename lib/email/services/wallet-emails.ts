/**
 * Wallet Email Service
 * Handles sending all wallet-related notification emails
 *
 * These go to a business's own staff about their own money, so they send on the
 * tenant's SMTP credentials and under the tenant's brand where one is configured.
 *
 * The exception is sendWalletFrozenEmail. A freeze is the platform enforcing something
 * against the account, and that notice has to arrive precisely when the tenant is in a
 * bad state, including when they are not cooperating. It must not depend on
 * infrastructure the tenant controls, so it always goes out on platform credentials.
 */

import { sendEmail } from '../utils/send-email';
import { type EmailResult } from '../types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/currency-converter';

// Import email templates
import LowBalanceAlertEmail from '../templates/wallet/low-balance-alert';
import TransactionCompletedEmail from '../templates/wallet/transaction-completed';
import WalletFrozenEmail from '../templates/wallet/wallet-frozen';
import SpendingLimitReachedEmail from '../templates/wallet/spending-limit-reached';
import MonthlyStatementEmail from '../templates/wallet/monthly-statement';

/**
 * The tenant these wallet notifications belong to.
 *
 * Optional during the rollout so existing callers keep compiling; step 4 makes it
 * required at the call sites that have it, which is all of them - every caller already
 * carries business_account_id in scope.
 */
interface TenantScoped {
  businessAccountId?: string | null;
}

// Type definitions for email data
export interface LowBalanceAlertData extends TenantScoped {
  businessName: string;
  businessEmail: string;
  currentBalance: number;
  threshold: number;
  currency: string;
  walletUrl: string;
}

export interface TransactionCompletedData extends TenantScoped {
  businessName: string;
  businessEmail: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  previousBalance: number;
  newBalance: number;
  transactionDate: Date;
  transactionId: string;
  walletUrl: string;
}

export interface WalletFrozenData extends TenantScoped {
  businessName: string;
  businessEmail: string;
  currentBalance: number;
  currency: string;
  freezeReason: string;
  frozenBy: string;
  freezeDate: Date;
  supportUrl: string;
}

export interface SpendingLimitReachedData extends TenantScoped {
  businessName: string;
  businessEmail: string;
  limitType: 'transaction' | 'daily' | 'monthly';
  limitAmount: number;
  currentSpend: number;
  currency: string;
  rejectedTransactionAmount?: number;
  resetDate?: Date;
  walletUrl: string;
  supportUrl: string;
}

export interface MonthlyStatementData extends TenantScoped {
  businessName: string;
  businessEmail: string;
  statementMonth: string;
  statementYear: number;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
  currency: string;
  pdfUrl?: string;
  walletUrl: string;
}

/**
 * Send low balance alert email
 */
export async function sendLowBalanceAlert(data: LowBalanceAlertData): Promise<EmailResult> {
  const { businessAccountId, ...templateProps } = data;

  return sendEmail({
    businessAccountId: businessAccountId ?? null,
    to: data.businessEmail,
    subject: `Low Balance Alert - ${formatCurrency(data.currentBalance, data.currency)} remaining`,
    template: LowBalanceAlertEmail,
    templateProps,
  });
}

/**
 * Send transaction completed email
 */
export async function sendTransactionCompletedEmail(
  data: TransactionCompletedData
): Promise<EmailResult> {
  const { businessAccountId, ...rest } = data;

  const isCredit = data.transactionType === 'credit';

  return sendEmail({
    businessAccountId: businessAccountId ?? null,
    to: data.businessEmail,
    subject: `Transaction ${isCredit ? 'Credit' : 'Debit'} - ${formatCurrency(Math.abs(data.amount), data.currency)}`,
    template: TransactionCompletedEmail,
    templateProps: {
      ...rest,
      transactionDate: format(data.transactionDate, 'PPp'),
    },
  });
}

/**
 * Send wallet frozen email
 *
 * Always platform credentials: see the note at the top of this file.
 */
export async function sendWalletFrozenEmail(data: WalletFrozenData): Promise<EmailResult> {
  const { businessAccountId: _ignored, ...rest } = data;

  return sendEmail({
    businessAccountId: null,
    to: data.businessEmail,
    subject: 'Your Wallet Has Been Frozen - Action Required',
    template: WalletFrozenEmail,
    templateProps: {
      ...rest,
      freezeDate: format(data.freezeDate, 'PPp'),
    },
  });
}

/**
 * Send spending limit reached email
 */
export async function sendSpendingLimitReachedEmail(
  data: SpendingLimitReachedData
): Promise<EmailResult> {
  const { businessAccountId, ...rest } = data;

  const limitTypeText = data.limitType === 'transaction' ? 'per-transaction' : data.limitType;

  return sendEmail({
    businessAccountId: businessAccountId ?? null,
    to: data.businessEmail,
    subject: `${limitTypeText.charAt(0).toUpperCase() + limitTypeText.slice(1)} Spending Limit Reached`,
    template: SpendingLimitReachedEmail,
    templateProps: {
      ...rest,
      resetDate: data.resetDate ? format(data.resetDate, 'PPp') : undefined,
    },
  });
}

/**
 * Send monthly statement email
 */
export async function sendMonthlyStatementEmail(data: MonthlyStatementData): Promise<EmailResult> {
  const { businessAccountId, ...templateProps } = data;

  return sendEmail({
    businessAccountId: businessAccountId ?? null,
    to: data.businessEmail,
    subject: `Monthly Wallet Statement - ${data.statementMonth} ${data.statementYear}`,
    template: MonthlyStatementEmail,
    templateProps,
  });
}

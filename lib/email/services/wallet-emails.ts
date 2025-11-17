'use server';

/**
 * Wallet Email Service
 * Handles sending all wallet-related notification emails
 */

import { jsx } from 'react/jsx-runtime';
import { getResendClient, getEmailConfig } from '../config';
import { type EmailResult } from '../types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/currency-converter';

// Import email templates
import LowBalanceAlertEmail from '../templates/wallet/low-balance-alert';
import TransactionCompletedEmail from '../templates/wallet/transaction-completed';
import AutoRechargeSuccessEmail from '../templates/wallet/auto-recharge-success';
import AutoRechargeFailedEmail from '../templates/wallet/auto-recharge-failed';
import WalletFrozenEmail from '../templates/wallet/wallet-frozen';
import SpendingLimitReachedEmail from '../templates/wallet/spending-limit-reached';
import MonthlyStatementEmail from '../templates/wallet/monthly-statement';

// Type definitions for email data
export interface LowBalanceAlertData {
  businessName: string;
  businessEmail: string;
  currentBalance: number;
  threshold: number;
  currency: string;
  walletUrl: string;
}

export interface TransactionCompletedData {
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

export interface AutoRechargeSuccessData {
  businessName: string;
  businessEmail: string;
  rechargeAmount: number;
  currency: string;
  previousBalance: number;
  newBalance: number;
  paymentMethod: string;
  rechargeDate: Date;
  rechargeId: string;
  walletUrl: string;
}

export interface AutoRechargeFailedData {
  businessName: string;
  businessEmail: string;
  attemptedAmount: number;
  currency: string;
  currentBalance: number;
  paymentMethod: string;
  failureReason: string;
  attemptDate: Date;
  nextRetryDate?: Date;
  walletUrl: string;
}

export interface WalletFrozenData {
  businessName: string;
  businessEmail: string;
  currentBalance: number;
  currency: string;
  freezeReason: string;
  frozenBy: string;
  freezeDate: Date;
  supportUrl: string;
}

export interface SpendingLimitReachedData {
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

export interface MonthlyStatementData {
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
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.businessEmail,
      replyTo: emailConfig.replyTo,
      subject: `Low Balance Alert - ${formatCurrency(data.currentBalance, data.currency)} remaining`,
      react: jsx(LowBalanceAlertEmail, data),
    });

    if (error) {
      console.error('Failed to send low balance alert:', error);
      return {
        success: false,
        error: error.message || 'Failed to send low balance alert',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending low balance alert:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send transaction completed email
 */
export async function sendTransactionCompletedEmail(
  data: TransactionCompletedData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const formattedData = {
      ...data,
      transactionDate: format(data.transactionDate, 'PPp'),
    };

    const isCredit = data.transactionType === 'credit';
    const subject = `Transaction ${isCredit ? 'Credit' : 'Debit'} - ${formatCurrency(Math.abs(data.amount), data.currency)}`;

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.businessEmail,
      replyTo: emailConfig.replyTo,
      subject,
      react: jsx(TransactionCompletedEmail, formattedData),
    });

    if (error) {
      console.error('Failed to send transaction completed email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send transaction completed email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending transaction completed email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send auto-recharge success email
 */
export async function sendAutoRechargeSuccessEmail(
  data: AutoRechargeSuccessData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const formattedData = {
      ...data,
      rechargeDate: format(data.rechargeDate, 'PPp'),
    };

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.businessEmail,
      replyTo: emailConfig.replyTo,
      subject: `Auto-Recharge Successful - ${formatCurrency(data.rechargeAmount, data.currency)} added`,
      react: jsx(AutoRechargeSuccessEmail, formattedData),
    });

    if (error) {
      console.error('Failed to send auto-recharge success email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send auto-recharge success email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending auto-recharge success email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send auto-recharge failed email
 */
export async function sendAutoRechargeFailedEmail(
  data: AutoRechargeFailedData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const formattedData = {
      ...data,
      attemptDate: format(data.attemptDate, 'PPp'),
      nextRetryDate: data.nextRetryDate ? format(data.nextRetryDate, 'PPp') : undefined,
    };

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.businessEmail,
      replyTo: emailConfig.replyTo,
      subject: 'Auto-Recharge Failed - Action Required',
      react: jsx(AutoRechargeFailedEmail, formattedData),
    });

    if (error) {
      console.error('Failed to send auto-recharge failed email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send auto-recharge failed email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending auto-recharge failed email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send wallet frozen email
 */
export async function sendWalletFrozenEmail(data: WalletFrozenData): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const formattedData = {
      ...data,
      freezeDate: format(data.freezeDate, 'PPp'),
    };

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.businessEmail,
      replyTo: emailConfig.replyTo,
      subject: 'Your Wallet Has Been Frozen - Action Required',
      react: jsx(WalletFrozenEmail, formattedData),
    });

    if (error) {
      console.error('Failed to send wallet frozen email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send wallet frozen email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending wallet frozen email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send spending limit reached email
 */
export async function sendSpendingLimitReachedEmail(
  data: SpendingLimitReachedData
): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const formattedData = {
      ...data,
      resetDate: data.resetDate ? format(data.resetDate, 'PPp') : undefined,
    };

    const limitTypeText = data.limitType === 'transaction' ? 'per-transaction' : data.limitType;
    const subject = `${limitTypeText.charAt(0).toUpperCase() + limitTypeText.slice(1)} Spending Limit Reached`;

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.businessEmail,
      replyTo: emailConfig.replyTo,
      subject,
      react: jsx(SpendingLimitReachedEmail, formattedData),
    });

    if (error) {
      console.error('Failed to send spending limit reached email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send spending limit reached email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending spending limit reached email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

/**
 * Send monthly statement email
 */
export async function sendMonthlyStatementEmail(data: MonthlyStatementData): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const emailConfig = getEmailConfig();

    const { data: emailData, error } = await resend.emails.send({
      from: emailConfig.from,
      to: data.businessEmail,
      replyTo: emailConfig.replyTo,
      subject: `Monthly Wallet Statement - ${data.statementMonth} ${data.statementYear}`,
      react: jsx(MonthlyStatementEmail, data),
    });

    if (error) {
      console.error('Failed to send monthly statement email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send monthly statement email',
      };
    }

    return {
      success: true,
      emailId: emailData?.id,
    };
  } catch (error) {
    console.error('Unexpected error sending monthly statement email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while sending the email',
    };
  }
}

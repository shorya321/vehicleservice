/**
 * Wallet Operations Utilities for B2B Business Accounts
 * Handles wallet calculations, formatting, and validation
 *
 * SCOPE: Business module only.
 */

import { convertAmount } from '@/lib/currency/format';
import type { ExchangeRatesMap } from '@/lib/currency/types';

/** Business wallets, bookings and Stripe charges are all denominated in AED. */
export const BUSINESS_BASE_CURRENCY = 'AED';

/**
 * Format amount as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: AED)
 * @returns Formatted currency string
 * @example formatCurrency(1234.56) → "1,234.56 د.إ"
 */
export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Convert an AED amount into the business's display currency.
 *
 * Display only — never persist the result. Stored balances, booking prices and Stripe
 * charges stay in AED. Callers load `rates` server-side with `getExchangeRates()` from
 * `@/lib/currency/server` and pass them down; that module is server-only, so it must not
 * be imported here.
 *
 * @param aedAmount - Amount in AED
 * @param displayCurrency - Target currency code
 * @param rates - AED-based rates map (1 AED = X target)
 */
export function convertFromAed(
  aedAmount: number,
  displayCurrency: string,
  rates: ExchangeRatesMap
): number {
  if (displayCurrency === BUSINESS_BASE_CURRENCY) return aedAmount;
  return convertAmount(aedAmount, BUSINESS_BASE_CURRENCY, displayCurrency, rates);
}

/**
 * Convert a stored amount into the business's display currency.
 *
 * Wallet rows normally carry AED, but `admin_adjust_wallet` still stamps 'USD', so the
 * source currency must be honoured rather than assumed.
 *
 * @param amount - Amount in `fromCurrency`
 * @param fromCurrency - Currency the amount is stored in
 * @param displayCurrency - Target currency code
 * @param rates - AED-based rates map
 */
export function convertForDisplay(
  amount: number,
  fromCurrency: string,
  displayCurrency: string,
  rates: ExchangeRatesMap
): number {
  if (fromCurrency === displayCurrency) return amount;
  return convertAmount(amount, fromCurrency, displayCurrency, rates);
}

/**
 * Format an AED amount in the display currency, appending the AED original when they
 * differ, so the business always sees what was actually charged.
 *
 * @example formatWithAedReference(250, 'EUR', rates) → "€59.53 (AED 250.00)"
 * @example formatWithAedReference(250, 'AED', rates) → "AED 250.00"
 */
export function formatWithAedReference(
  aedAmount: number,
  displayCurrency: string,
  rates: ExchangeRatesMap
): string {
  if (displayCurrency === BUSINESS_BASE_CURRENCY) {
    return formatCurrency(aedAmount, BUSINESS_BASE_CURRENCY);
  }
  const converted = convertFromAed(aedAmount, displayCurrency, rates);
  return `${formatCurrency(converted, displayCurrency)} (${formatCurrency(aedAmount, BUSINESS_BASE_CURRENCY)})`;
}

/**
 * Calculate total booking price
 * @param basePrice - Base transfer price
 * @param amenitiesPrice - Additional amenities price
 * @returns Total price
 */
export function calculateBookingTotal(
  basePrice: number,
  amenitiesPrice: number
): number {
  return Number((basePrice + amenitiesPrice).toFixed(2));
}

/**
 * Validate wallet balance is sufficient
 * @param balance - Current wallet balance
 * @param requiredAmount - Amount required
 * @returns true if sufficient balance
 */
export function hasSufficientBalance(
  balance: number,
  requiredAmount: number
): boolean {
  return balance >= requiredAmount;
}

/**
 * Get transaction type display name
 * @param type - Transaction type
 * @returns Human-readable transaction type
 */
export function getTransactionTypeLabel(
  type: 'credit_added' | 'booking_deduction' | 'refund' | 'admin_adjustment'
): string {
  const labels: Record<string, string> = {
    credit_added: 'Wallet Recharge',
    booking_deduction: 'Booking Payment',
    refund: 'Booking Refund',
    admin_adjustment: 'Admin Adjustment',
  };
  return labels[type] || type;
}

/**
 * Get transaction type color for UI
 * @param type - Transaction type
 * @returns Color class for styling
 */
export function getTransactionTypeColor(
  type: 'credit_added' | 'booking_deduction' | 'refund' | 'admin_adjustment'
): string {
  const colors: Record<string, string> = {
    credit_added: 'text-green-600',
    booking_deduction: 'text-red-600',
    refund: 'text-green-600',
    admin_adjustment: 'text-blue-600',
  };
  return colors[type] || 'text-gray-600';
}

/**
 * Format transaction amount with sign
 * @param amount - Transaction amount (positive or negative)
 * @param currency - Currency code
 * @returns Formatted amount with + or - sign
 */
export function formatTransactionAmount(
  amount: number,
  currency: string = 'AED'
): string {
  const sign = amount >= 0 ? '+' : '';
  return sign + formatCurrency(amount, currency);
}

/**
 * Calculate balance after transaction
 * @param currentBalance - Current balance
 * @param amount - Transaction amount (positive for credit, negative for debit)
 * @returns New balance after transaction
 */
export function calculateBalanceAfter(
  currentBalance: number,
  amount: number
): number {
  return Number((currentBalance + amount).toFixed(2));
}

/**
 * Validate amount is positive and within limits
 * @param amount - Amount to validate
 * @param maxAmount - Maximum allowed amount (optional)
 * @returns Validation result
 */
export function validateAmount(
  amount: number,
  maxAmount?: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  if (maxAmount && amount > maxAmount) {
    return { valid: false, error: `Amount cannot exceed ${formatCurrency(maxAmount)}` };
  }

  return { valid: true };
}

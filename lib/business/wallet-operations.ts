/**
 * Wallet Operations Utilities for B2B Business Accounts
 * Handles wallet calculations, formatting, and validation
 */

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

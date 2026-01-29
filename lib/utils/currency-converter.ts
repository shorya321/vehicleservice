/**
 * Currency Converter Utility
 * Handles multi-currency support for wallet transactions
 */

/**
 * Supported currencies with their properties
 */
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', decimals: 2, code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', decimals: 2, code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2, code: 'GBP' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2, code: 'AUD' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', decimals: 2, code: 'CAD' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', decimals: 2, code: 'CHF' },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', decimals: 2, code: 'AED' },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', decimals: 2, code: 'SAR' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', decimals: 2, code: 'SGD' },
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2, code: 'INR' },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0, code: 'JPY' },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

/**
 * Exchange rates (AED as base currency)
 * In production, these should be fetched from a reliable API
 * and cached appropriately
 * Values represent: 1 AED = X target currency
 */
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  AED: 1.0,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.22,
  AUD: 0.41,
  CAD: 0.37,
  CHF: 0.24,
  SAR: 1.02,
  SGD: 0.37,
  INR: 22.65,
  JPY: 40.74,
};

/**
 * Validate if a currency code is supported
 */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in SUPPORTED_CURRENCIES;
}

/**
 * Get currency information
 */
export function getCurrencyInfo(code: CurrencyCode) {
  return SUPPORTED_CURRENCIES[code];
}

/**
 * Convert amount from one currency to another
 * @param amount Amount to convert
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Converted amount and exchange rate
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): { convertedAmount: number; exchangeRate: number } {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, exchangeRate: 1.0 };
  }

  // Convert to AED first, then to target currency
  const amountInAED = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = amountInAED * EXCHANGE_RATES[toCurrency];
  const exchangeRate = EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];

  // Round to appropriate decimal places
  const decimals = SUPPORTED_CURRENCIES[toCurrency].decimals;
  const roundedAmount = Number(convertedAmount.toFixed(decimals));

  return {
    convertedAmount: roundedAmount,
    exchangeRate: Number(exchangeRate.toFixed(6)),
  };
}

/**
 * Format currency amount for display
 * @param amount Amount to format
 * @param currency Currency code
 * @param locale Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale: string = 'en-US'
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currencyInfo.decimals,
    maximumFractionDigits: currencyInfo.decimals,
  }).format(amount);
}

/**
 * Format amount with currency symbol
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted string with symbol
 */
export function formatWithSymbol(amount: number, currency: CurrencyCode): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  const formattedAmount = amount.toFixed(currencyInfo.decimals);

  // For some currencies, symbol goes after the amount
  if (['EUR', 'CHF'].includes(currency)) {
    return `${formattedAmount} ${currencyInfo.symbol}`;
  }

  return `${currencyInfo.symbol}${formattedAmount}`;
}

/**
 * Convert amount to smallest currency unit (e.g., cents)
 * Used for Stripe API calls
 * @param amount Amount in major units
 * @param currency Currency code
 * @returns Amount in smallest units
 */
export function toSmallestUnit(amount: number, currency: CurrencyCode): number {
  const decimals = SUPPORTED_CURRENCIES[currency].decimals;
  return Math.round(amount * Math.pow(10, decimals));
}

/**
 * Convert amount from smallest currency unit to major units
 * @param amount Amount in smallest units
 * @param currency Currency code
 * @returns Amount in major units
 */
export function fromSmallestUnit(amount: number, currency: CurrencyCode): number {
  const decimals = SUPPORTED_CURRENCIES[currency].decimals;
  return amount / Math.pow(10, decimals);
}

/**
 * Get all supported currencies as options
 * @returns Array of currency options for select dropdowns
 */
export function getCurrencyOptions(): Array<{
  code: CurrencyCode;
  name: string;
  symbol: string;
}> {
  return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
    code: code as CurrencyCode,
    name: info.name,
    symbol: info.symbol,
  }));
}

/**
 * Get exchange rate between two currencies
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @returns Exchange rate
 */
export function getExchangeRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
  if (fromCurrency === toCurrency) return 1.0;

  const rate = EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];
  return Number(rate.toFixed(6));
}

/**
 * Calculate fees for currency conversion
 * @param amount Amount being converted
 * @param fromCurrency Source currency
 * @param toCurrency Target currency
 * @param feePercentage Fee percentage (default: 2%)
 * @returns Fee amount and total with fee
 */
export function calculateConversionFee(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  feePercentage: number = 2.0
): { fee: number; totalWithFee: number } {
  if (fromCurrency === toCurrency) {
    return { fee: 0, totalWithFee: amount };
  }

  const fee = amount * (feePercentage / 100);
  const decimals = SUPPORTED_CURRENCIES[fromCurrency].decimals;
  const roundedFee = Number(fee.toFixed(decimals));
  const totalWithFee = Number((amount + roundedFee).toFixed(decimals));

  return { fee: roundedFee, totalWithFee };
}

/**
 * Validate currency amount
 * @param amount Amount to validate
 * @param currency Currency code
 * @returns Validation result
 */
export function validateAmount(
  amount: number,
  currency: CurrencyCode
): { valid: boolean; error?: string } {
  if (isNaN(amount) || !isFinite(amount)) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be positive' };
  }

  // Check decimal places
  const decimals = SUPPORTED_CURRENCIES[currency].decimals;
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;

  if (decimalPlaces > decimals) {
    return {
      valid: false,
      error: `${currency} supports maximum ${decimals} decimal places`,
    };
  }

  return { valid: true };
}

/**
 * Parse amount string to number
 * Handles different number formats and currency symbols
 * @param amountString Amount as string
 * @returns Parsed number or null if invalid
 */
export function parseAmount(amountString: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = amountString.replace(/[^0-9.,\-]/g, '').trim();

  // Handle different decimal separators
  const normalized = cleaned.replace(',', '.');

  const parsed = parseFloat(normalized);

  if (isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Fetch latest exchange rates from external API
 * This should be implemented in production using a real API
 * @returns Promise with exchange rates or null on error
 */
export async function fetchLatestExchangeRates(): Promise<Record<CurrencyCode, number> | null> {
  // TODO: Implement with real API in production
  // Example: exchangerate-api.com, openexchangerates.org, or Stripe API
  console.warn('Using mock exchange rates. Implement real API in production.');
  return EXCHANGE_RATES;
}

/**
 * Get minimum recharge amount for a currency
 * Different currencies have different minimum amounts
 */
export function getMinimumRechargeAmount(currency: CurrencyCode): number {
  const minimums: Record<CurrencyCode, number> = {
    USD: 10,
    EUR: 10,
    GBP: 10,
    AUD: 15,
    CAD: 15,
    CHF: 10,
    AED: 40,
    SAR: 40,
    SGD: 15,
    INR: 800,
    JPY: 1000,
  };

  return minimums[currency];
}

/**
 * Get maximum recharge amount for a currency
 */
export function getMaximumRechargeAmount(currency: CurrencyCode): number {
  const maximums: Record<CurrencyCode, number> = {
    USD: 10000,
    EUR: 10000,
    GBP: 10000,
    AUD: 15000,
    CAD: 15000,
    CHF: 10000,
    AED: 40000,
    SAR: 40000,
    SGD: 15000,
    INR: 800000,
    JPY: 1000000,
  };

  return maximums[currency];
}

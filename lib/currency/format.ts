/**
 * Currency Formatting Utilities
 *
 * Functions for formatting prices with currency conversion.
 * Works on both server and client.
 */

import type { ExchangeRatesMap, CurrencyInfo } from './types'
import { DEFAULT_CURRENCY_CODE } from './types'

/**
 * Currency metadata for formatting
 */
const CURRENCY_METADATA: Record<string, { symbol: string; decimalPlaces: number; symbolPosition: 'before' | 'after' }> = {
  USD: { symbol: '$', decimalPlaces: 2, symbolPosition: 'before' },
  EUR: { symbol: '€', decimalPlaces: 2, symbolPosition: 'after' },
  GBP: { symbol: '£', decimalPlaces: 2, symbolPosition: 'before' },
  AED: { symbol: 'د.إ', decimalPlaces: 2, symbolPosition: 'after' },
  AUD: { symbol: 'A$', decimalPlaces: 2, symbolPosition: 'before' },
  CAD: { symbol: 'C$', decimalPlaces: 2, symbolPosition: 'before' },
  CHF: { symbol: 'CHF', decimalPlaces: 2, symbolPosition: 'after' },
  SAR: { symbol: '﷼', decimalPlaces: 2, symbolPosition: 'after' },
  SGD: { symbol: 'S$', decimalPlaces: 2, symbolPosition: 'before' },
  INR: { symbol: '₹', decimalPlaces: 2, symbolPosition: 'before' },
  JPY: { symbol: '¥', decimalPlaces: 0, symbolPosition: 'before' },
}

/**
 * Convert amount from one currency to another
 *
 * @param amount - Amount in source currency
 * @param fromCurrency - Source currency code (default: AED)
 * @param toCurrency - Target currency code
 * @param rates - Exchange rates object (currency -> rate from AED)
 * @returns Converted amount
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRatesMap
): number {
  // Handle invalid amounts
  if (!amount || isNaN(amount) || !isFinite(amount)) {
    return 0
  }

  // No conversion needed
  if (fromCurrency === toCurrency) {
    return amount
  }

  // Get rates (all rates are from AED base)
  const fromRate = rates[fromCurrency] || 1.0
  const toRate = rates[toCurrency] || 1.0

  // Convert: amount -> AED -> target currency
  // If fromCurrency is AED, fromRate is 1.0
  // If toCurrency is AED, toRate is 1.0
  const amountInAed = amount / fromRate
  const convertedAmount = amountInAed * toRate

  // Round to appropriate decimal places
  const meta = CURRENCY_METADATA[toCurrency] || { decimalPlaces: 2 }
  return Number(convertedAmount.toFixed(meta.decimalPlaces))
}

/**
 * Format amount with currency symbol
 *
 * @param amount - Amount to format
 * @param currencyCode - Currency code
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatAmount(
  amount: number,
  currencyCode: string,
  options?: {
    showCode?: boolean
    locale?: string
  }
): string {
  const meta = CURRENCY_METADATA[currencyCode] || CURRENCY_METADATA.AED
  const { showCode = false, locale = 'en-US' } = options || {}

  // Handle invalid amounts
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0
  }

  // Format number with appropriate decimal places
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: meta.decimalPlaces,
    maximumFractionDigits: meta.decimalPlaces,
  }).format(amount)

  // Build final string
  let result: string
  if (meta.symbolPosition === 'after') {
    result = `${formattedNumber} ${meta.symbol}`
  } else {
    result = `${meta.symbol}${formattedNumber}`
  }

  // Optionally append currency code
  if (showCode) {
    result = `${result} ${currencyCode}`
  }

  return result
}

/**
 * Format price with currency conversion (main function for display)
 *
 * Converts from base currency (AED) to target currency and formats.
 *
 * @param amount - Amount in AED (base currency)
 * @param targetCurrency - Target currency code to display
 * @param rates - Exchange rates object
 * @param options - Formatting options
 * @returns Formatted price string in target currency
 */
export function formatPrice(
  amount: number,
  targetCurrency: string,
  rates: ExchangeRatesMap,
  options?: {
    sourceCurrency?: string
    showCode?: boolean
    locale?: string
  }
): string {
  const { sourceCurrency = 'AED', showCode = false, locale = 'en-US' } = options || {}

  // Convert amount
  const convertedAmount = convertAmount(amount, sourceCurrency, targetCurrency, rates)

  // Format and return
  return formatAmount(convertedAmount, targetCurrency, { showCode, locale })
}

/**
 * Format price range (e.g., "100 د.إ - 200 د.إ" -> "€25 - €50")
 *
 * @param minAmount - Minimum amount in AED
 * @param maxAmount - Maximum amount in AED
 * @param targetCurrency - Target currency code
 * @param rates - Exchange rates object
 * @returns Formatted price range string
 */
export function formatPriceRange(
  minAmount: number,
  maxAmount: number,
  targetCurrency: string,
  rates: ExchangeRatesMap
): string {
  const minFormatted = formatPrice(minAmount, targetCurrency, rates)
  const maxFormatted = formatPrice(maxAmount, targetCurrency, rates)

  return `${minFormatted} - ${maxFormatted}`
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_METADATA[currencyCode]?.symbol || currencyCode
}

/**
 * Get decimal places for a currency
 */
export function getCurrencyDecimalPlaces(currencyCode: string): number {
  return CURRENCY_METADATA[currencyCode]?.decimalPlaces ?? 2
}

/**
 * Parse formatted price to number
 * Removes currency symbols and formatting
 */
export function parseFormattedPrice(formattedPrice: string): number | null {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = formattedPrice
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.')
    .trim()

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

/**
 * Format price for display in booking/payment context
 * Shows converted amount with note about AED charge
 */
export function formatDisplayPrice(
  amountInAed: number,
  targetCurrency: string,
  rates: ExchangeRatesMap
): {
  displayAmount: string
  originalAmount: string
  isConverted: boolean
} {
  const isConverted = targetCurrency !== 'AED'

  return {
    displayAmount: formatPrice(amountInAed, targetCurrency, rates),
    originalAmount: formatPrice(amountInAed, 'AED', rates),
    isConverted,
  }
}

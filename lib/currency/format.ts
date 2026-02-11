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
  // Original currencies
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
  // Asian currencies
  CNY: { symbol: '¥', decimalPlaces: 2, symbolPosition: 'before' },
  HKD: { symbol: 'HK$', decimalPlaces: 2, symbolPosition: 'before' },
  KRW: { symbol: '₩', decimalPlaces: 0, symbolPosition: 'before' },
  MYR: { symbol: 'RM', decimalPlaces: 2, symbolPosition: 'before' },
  THB: { symbol: '฿', decimalPlaces: 2, symbolPosition: 'before' },
  IDR: { symbol: 'Rp', decimalPlaces: 0, symbolPosition: 'before' },
  PHP: { symbol: '₱', decimalPlaces: 2, symbolPosition: 'before' },
  TWD: { symbol: 'NT$', decimalPlaces: 2, symbolPosition: 'before' },
  VND: { symbol: '₫', decimalPlaces: 0, symbolPosition: 'after' },
  PKR: { symbol: '₨', decimalPlaces: 2, symbolPosition: 'before' },
  BDT: { symbol: '৳', decimalPlaces: 2, symbolPosition: 'before' },
  LKR: { symbol: 'Rs', decimalPlaces: 2, symbolPosition: 'before' },
  // European currencies
  NZD: { symbol: 'NZ$', decimalPlaces: 2, symbolPosition: 'before' },
  SEK: { symbol: 'kr', decimalPlaces: 2, symbolPosition: 'after' },
  NOK: { symbol: 'kr', decimalPlaces: 2, symbolPosition: 'after' },
  DKK: { symbol: 'kr', decimalPlaces: 2, symbolPosition: 'after' },
  PLN: { symbol: 'zł', decimalPlaces: 2, symbolPosition: 'after' },
  CZK: { symbol: 'Kč', decimalPlaces: 2, symbolPosition: 'after' },
  HUF: { symbol: 'Ft', decimalPlaces: 0, symbolPosition: 'after' },
  RON: { symbol: 'lei', decimalPlaces: 2, symbolPosition: 'after' },
  BGN: { symbol: 'лв', decimalPlaces: 2, symbolPosition: 'after' },
  HRK: { symbol: 'kn', decimalPlaces: 2, symbolPosition: 'after' },
  ISK: { symbol: 'kr', decimalPlaces: 0, symbolPosition: 'after' },
  TRY: { symbol: '₺', decimalPlaces: 2, symbolPosition: 'before' },
  RUB: { symbol: '₽', decimalPlaces: 2, symbolPosition: 'after' },
  // Latin American currencies
  BRL: { symbol: 'R$', decimalPlaces: 2, symbolPosition: 'before' },
  MXN: { symbol: 'MX$', decimalPlaces: 2, symbolPosition: 'before' },
  CLP: { symbol: 'CLP$', decimalPlaces: 0, symbolPosition: 'before' },
  COP: { symbol: 'COL$', decimalPlaces: 0, symbolPosition: 'before' },
  ARS: { symbol: 'AR$', decimalPlaces: 2, symbolPosition: 'before' },
  PEN: { symbol: 'S/.', decimalPlaces: 2, symbolPosition: 'before' },
  // African & Middle Eastern currencies
  ZAR: { symbol: 'R', decimalPlaces: 2, symbolPosition: 'before' },
  ILS: { symbol: '₪', decimalPlaces: 2, symbolPosition: 'before' },
  EGP: { symbol: 'E£', decimalPlaces: 2, symbolPosition: 'before' },
  KWD: { symbol: 'د.ك', decimalPlaces: 3, symbolPosition: 'after' },
  BHD: { symbol: '.د.ب', decimalPlaces: 3, symbolPosition: 'after' },
  OMR: { symbol: '﷼', decimalPlaces: 3, symbolPosition: 'after' },
  QAR: { symbol: '﷼', decimalPlaces: 2, symbolPosition: 'after' },
  JOD: { symbol: 'د.ا', decimalPlaces: 3, symbolPosition: 'after' },
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
 * Get flag emoji for a currency code
 */
const CURRENCY_FLAGS: Record<string, string> = {
  AED: '\u{1F1E6}\u{1F1EA}', // 🇦🇪
  USD: '\u{1F1FA}\u{1F1F8}', // 🇺🇸
  EUR: '\u{1F1EA}\u{1F1FA}', // 🇪🇺
  GBP: '\u{1F1EC}\u{1F1E7}', // 🇬🇧
  AUD: '\u{1F1E6}\u{1F1FA}', // 🇦🇺
  CAD: '\u{1F1E8}\u{1F1E6}', // 🇨🇦
  CHF: '\u{1F1E8}\u{1F1ED}', // 🇨🇭
  SAR: '\u{1F1F8}\u{1F1E6}', // 🇸🇦
  SGD: '\u{1F1F8}\u{1F1EC}', // 🇸🇬
  INR: '\u{1F1EE}\u{1F1F3}', // 🇮🇳
  JPY: '\u{1F1EF}\u{1F1F5}', // 🇯🇵
  CNY: '\u{1F1E8}\u{1F1F3}', // 🇨🇳
  HKD: '\u{1F1ED}\u{1F1F0}', // 🇭🇰
  KRW: '\u{1F1F0}\u{1F1F7}', // 🇰🇷
  MYR: '\u{1F1F2}\u{1F1FE}', // 🇲🇾
  THB: '\u{1F1F9}\u{1F1ED}', // 🇹🇭
  IDR: '\u{1F1EE}\u{1F1E9}', // 🇮🇩
  PHP: '\u{1F1F5}\u{1F1ED}', // 🇵🇭
  TWD: '\u{1F1F9}\u{1F1FC}', // 🇹🇼
  VND: '\u{1F1FB}\u{1F1F3}', // 🇻🇳
  PKR: '\u{1F1F5}\u{1F1F0}', // 🇵🇰
  BDT: '\u{1F1E7}\u{1F1E9}', // 🇧🇩
  LKR: '\u{1F1F1}\u{1F1F0}', // 🇱🇰
  NZD: '\u{1F1F3}\u{1F1FF}', // 🇳🇿
  SEK: '\u{1F1F8}\u{1F1EA}', // 🇸🇪
  NOK: '\u{1F1F3}\u{1F1F4}', // 🇳🇴
  DKK: '\u{1F1E9}\u{1F1F0}', // 🇩🇰
  PLN: '\u{1F1F5}\u{1F1F1}', // 🇵🇱
  CZK: '\u{1F1E8}\u{1F1FF}', // 🇨🇿
  HUF: '\u{1F1ED}\u{1F1FA}', // 🇭🇺
  RON: '\u{1F1F7}\u{1F1F4}', // 🇷🇴
  BGN: '\u{1F1E7}\u{1F1EC}', // 🇧🇬
  HRK: '\u{1F1ED}\u{1F1F7}', // 🇭🇷
  ISK: '\u{1F1EE}\u{1F1F8}', // 🇮🇸
  TRY: '\u{1F1F9}\u{1F1F7}', // 🇹🇷
  RUB: '\u{1F1F7}\u{1F1FA}', // 🇷🇺
  BRL: '\u{1F1E7}\u{1F1F7}', // 🇧🇷
  MXN: '\u{1F1F2}\u{1F1FD}', // 🇲🇽
  CLP: '\u{1F1E8}\u{1F1F1}', // 🇨🇱
  COP: '\u{1F1E8}\u{1F1F4}', // 🇨🇴
  ARS: '\u{1F1E6}\u{1F1F7}', // 🇦🇷
  PEN: '\u{1F1F5}\u{1F1EA}', // 🇵🇪
  ZAR: '\u{1F1FF}\u{1F1E6}', // 🇿🇦
  ILS: '\u{1F1EE}\u{1F1F1}', // 🇮🇱
  EGP: '\u{1F1EA}\u{1F1EC}', // 🇪🇬
  KWD: '\u{1F1F0}\u{1F1FC}', // 🇰🇼
  BHD: '\u{1F1E7}\u{1F1ED}', // 🇧🇭
  OMR: '\u{1F1F4}\u{1F1F2}', // 🇴🇲
  QAR: '\u{1F1F6}\u{1F1E6}', // 🇶🇦
  JOD: '\u{1F1EF}\u{1F1F4}', // 🇯🇴
}

export function getCurrencyFlag(code: string): string {
  return CURRENCY_FLAGS[code] || '\u{1F3F3}\u{FE0F}'
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

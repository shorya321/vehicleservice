/**
 * Multi-Currency Module
 *
 * Display-only multi-currency support for public frontend.
 * All payments are processed in AED (base currency).
 *
 * Usage:
 *
 * Server Components:
 * ```tsx
 * import { getEnabledCurrencies, getExchangeRates, formatPrice } from '@/lib/currency'
 *
 * const currencies = await getEnabledCurrencies()
 * const rates = await getExchangeRates()
 * const price = formatPrice(100, 'EUR', rates) // "€92.00"
 * ```
 *
 * Client Components:
 * ```tsx
 * import { formatPrice, setCurrencyInClientCookie } from '@/lib/currency'
 *
 * // Format with rates passed from server
 * const price = formatPrice(100, userCurrency, rates)
 *
 * // Update currency preference
 * setCurrencyInClientCookie('EUR')
 * ```
 */

// Types
export type {
  CurrencySetting,
  ExchangeRate,
  CurrencyInfo,
  ExchangeRatesMap,
  CurrencyPreference,
  ConvertedPrice,
  CurrencyApiResponse,
  CurrencyStatus,
  SupportedCurrencyCode,
} from './types'

export {
  SUPPORTED_CURRENCY_CODES,
  CURRENCY_COOKIE_NAME,
  CURRENCY_COOKIE_MAX_AGE,
  DEFAULT_CURRENCY_CODE,
} from './types'

// Server utilities
export {
  getEnabledCurrencies,
  getFeaturedCurrencies,
  getPaginatedCurrencies,
  getAllCurrencies,
  getExchangeRates,
  getExchangeRatesObject,
  getDefaultCurrency,
  isCurrencyEnabled,
  getCurrencyInfo,
  getLastRateUpdate,
  areRatesStale,
} from './server'

// Format utilities
export {
  convertAmount,
  formatAmount,
  formatPrice,
  formatPriceRange,
  getCurrencySymbol,
  getCurrencyDecimalPlaces,
  parseFormattedPrice,
  formatDisplayPrice,
} from './format'

// Detection utilities
export {
  parseAcceptLanguage,
  extractCountryCode,
  extractLanguageCode,
  detectCurrencyFromLocale,
  detectCurrencyFromAcceptLanguage,
  isValidCurrencyCode,
  getUserCurrency,
} from './detect'

// Context (client-side currency switching)
export { CurrencyProvider, useCurrency } from './context'

// Cookie utilities
export {
  CURRENCY_COOKIE_OPTIONS,
  getCurrencyFromCookies,
  setCurrencyInCookies,
  getCurrencyFromClientCookie,
  setCurrencyInClientCookie,
  clearCurrencyCookie,
  serializeCurrencyCookie,
} from './cookie'

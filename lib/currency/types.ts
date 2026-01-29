/**
 * Multi-Currency Type Definitions
 *
 * TypeScript interfaces for the multi-currency system.
 */

/**
 * Currency settings from database
 */
export interface CurrencySetting {
  id: string
  currency_code: string
  name: string
  symbol: string
  decimal_places: number
  is_enabled: boolean
  is_default: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * Exchange rate record from database
 */
export interface ExchangeRate {
  id: string
  base_currency: string
  target_currency: string
  rate: number
  fetched_at: string
  created_at: string
}

/**
 * Simplified currency info for UI
 */
export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  decimalPlaces: number
  isDefault: boolean
}

/**
 * Exchange rates map (target currency -> rate from AED)
 * Uses plain object instead of Map for proper serialization with unstable_cache
 */
export type ExchangeRatesMap = Record<string, number>

/**
 * Currency preference stored in cookie
 */
export interface CurrencyPreference {
  code: string
  detectedFrom: 'cookie' | 'browser' | 'default'
}

/**
 * Price conversion result
 */
export interface ConvertedPrice {
  amount: number
  formatted: string
  currency: string
  rate: number
}

/**
 * Currency API response
 */
export interface CurrencyApiResponse {
  valid: boolean
  updated: number
  base: string
  rates: Record<string, number>
}

/**
 * Admin currency status
 */
export interface CurrencyStatus {
  lastUpdated: string | null
  isStale: boolean
  rateCount: number
  rates: Record<string, number>
}

/**
 * Default supported currency codes
 */
export const SUPPORTED_CURRENCY_CODES = [
  'USD', 'EUR', 'GBP', 'AED', 'AUD', 'CAD', 'CHF', 'SAR', 'SGD', 'INR', 'JPY'
] as const

export type SupportedCurrencyCode = typeof SUPPORTED_CURRENCY_CODES[number]

/**
 * Cookie name for currency preference
 */
export const CURRENCY_COOKIE_NAME = 'preferred-currency'

/**
 * Cookie max age (1 year in seconds)
 */
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY_CODE = 'AED'

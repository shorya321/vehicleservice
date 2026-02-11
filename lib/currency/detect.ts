/**
 * Currency Detection Utilities
 *
 * Detects user's preferred currency from browser locale/Accept-Language header.
 */

import { DEFAULT_CURRENCY_CODE, SUPPORTED_CURRENCY_CODES, type SupportedCurrencyCode } from './types'

/**
 * Map of country codes to currency codes
 * Used to detect currency from browser locale
 */
const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrencyCode> = {
  // USD countries
  US: 'USD',
  AS: 'USD', // American Samoa
  EC: 'USD', // Ecuador
  SV: 'USD', // El Salvador
  GU: 'USD', // Guam
  MH: 'USD', // Marshall Islands
  FM: 'USD', // Micronesia
  MP: 'USD', // Northern Mariana Islands
  PW: 'USD', // Palau
  PA: 'USD', // Panama
  PR: 'USD', // Puerto Rico
  TC: 'USD', // Turks and Caicos
  VG: 'USD', // British Virgin Islands
  VI: 'USD', // US Virgin Islands

  // EUR countries
  AT: 'EUR', // Austria
  BE: 'EUR', // Belgium
  HR: 'EUR', // Croatia
  CY: 'EUR', // Cyprus
  EE: 'EUR', // Estonia
  FI: 'EUR', // Finland
  FR: 'EUR', // France
  DE: 'EUR', // Germany
  GR: 'EUR', // Greece
  IE: 'EUR', // Ireland
  IT: 'EUR', // Italy
  LV: 'EUR', // Latvia
  LT: 'EUR', // Lithuania
  LU: 'EUR', // Luxembourg
  MT: 'EUR', // Malta
  NL: 'EUR', // Netherlands
  PT: 'EUR', // Portugal
  SK: 'EUR', // Slovakia
  SI: 'EUR', // Slovenia
  ES: 'EUR', // Spain
  AD: 'EUR', // Andorra
  MC: 'EUR', // Monaco
  SM: 'EUR', // San Marino
  VA: 'EUR', // Vatican City

  // GBP countries
  GB: 'GBP', // United Kingdom
  UK: 'GBP', // UK alias
  IM: 'GBP', // Isle of Man
  JE: 'GBP', // Jersey
  GG: 'GBP', // Guernsey

  // AED countries
  AE: 'AED', // United Arab Emirates

  // AUD countries
  AU: 'AUD', // Australia
  CX: 'AUD', // Christmas Island
  CC: 'AUD', // Cocos Islands
  HM: 'AUD', // Heard and McDonald Islands
  NF: 'AUD', // Norfolk Island
  KI: 'AUD', // Kiribati
  NR: 'AUD', // Nauru
  TV: 'AUD', // Tuvalu

  // CAD countries
  CA: 'CAD', // Canada

  // CHF countries
  CH: 'CHF', // Switzerland
  LI: 'CHF', // Liechtenstein

  // SAR countries
  SA: 'SAR', // Saudi Arabia

  // SGD countries
  SG: 'SGD', // Singapore

  // INR countries
  IN: 'INR', // India

  // JPY countries
  JP: 'JPY', // Japan
}

/**
 * Map of language codes to fallback currencies
 * Used when country code is not available
 */
const LANGUAGE_TO_CURRENCY: Record<string, SupportedCurrencyCode> = {
  en: 'USD', // Default English to USD
  de: 'EUR', // German
  fr: 'EUR', // French
  es: 'EUR', // Spanish (default to EUR for Europe)
  it: 'EUR', // Italian
  pt: 'EUR', // Portuguese
  nl: 'EUR', // Dutch
  ar: 'AED', // Arabic (default to AED for Gulf region)
  ja: 'JPY', // Japanese
  hi: 'INR', // Hindi
  zh: 'USD', // Chinese (default to USD)
}

/**
 * Parse Accept-Language header to extract locale
 *
 * @param acceptLanguage - Accept-Language header value
 * @returns Array of locale strings sorted by quality
 */
export function parseAcceptLanguage(acceptLanguage: string | null): string[] {
  if (!acceptLanguage) return []

  return acceptLanguage
    .split(',')
    .map((part) => {
      const [locale, q] = part.trim().split(';q=')
      return {
        locale: locale.trim(),
        quality: q ? parseFloat(q) : 1.0,
      }
    })
    .sort((a, b) => b.quality - a.quality)
    .map((item) => item.locale)
}

/**
 * Extract country code from locale string
 *
 * @param locale - Locale string (e.g., "en-US", "de-DE", "en")
 * @returns Country code in uppercase or null
 */
export function extractCountryCode(locale: string): string | null {
  // Handle full locale with country (e.g., "en-US", "de-DE")
  const parts = locale.split(/[-_]/)
  if (parts.length >= 2) {
    return parts[1].toUpperCase()
  }
  return null
}

/**
 * Extract language code from locale string
 *
 * @param locale - Locale string (e.g., "en-US", "de-DE", "en")
 * @returns Language code in lowercase
 */
export function extractLanguageCode(locale: string): string {
  const parts = locale.split(/[-_]/)
  return parts[0].toLowerCase()
}

/**
 * Detect currency from locale string
 *
 * @param locale - Locale string (e.g., "en-US", "de-DE")
 * @returns Currency code or null if not detected
 */
export function detectCurrencyFromLocale(locale: string): SupportedCurrencyCode | null {
  // Try country code first
  const countryCode = extractCountryCode(locale)
  if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
    return COUNTRY_TO_CURRENCY[countryCode]
  }

  // Fall back to language code
  const languageCode = extractLanguageCode(locale)
  if (LANGUAGE_TO_CURRENCY[languageCode]) {
    return LANGUAGE_TO_CURRENCY[languageCode]
  }

  return null
}

/**
 * Detect currency from Accept-Language header
 *
 * @param acceptLanguage - Accept-Language header value
 * @returns Detected currency code or default
 */
export function detectCurrencyFromAcceptLanguage(acceptLanguage: string | null): SupportedCurrencyCode {
  const locales = parseAcceptLanguage(acceptLanguage)

  for (const locale of locales) {
    const currency = detectCurrencyFromLocale(locale)
    if (currency) {
      return currency
    }
  }

  return DEFAULT_CURRENCY_CODE as SupportedCurrencyCode
}

/**
 * Validate if a currency code is supported
 */
export function isValidCurrencyCode(code: string): code is SupportedCurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(code as SupportedCurrencyCode)
}

/**
 * Get user's preferred currency from various sources
 *
 * Priority:
 * 1. Explicit preference (from cookie)
 * 2. Accept-Language header detection
 * 3. Default currency
 *
 * @param cookieValue - Value from preferred-currency cookie
 * @param acceptLanguage - Accept-Language header value
 * @param enabledCurrencies - List of enabled currency codes
 * @returns Currency code and detection source
 */
export function getUserCurrency(
  cookieValue: string | null,
  acceptLanguage: string | null,
  enabledCurrencies: string[]
): { code: string; source: 'cookie' | 'browser' | 'default' } {
  // Check cookie first
  if (cookieValue && isValidCurrencyCode(cookieValue) && enabledCurrencies.includes(cookieValue)) {
    return { code: cookieValue, source: 'cookie' }
  }

  // Detect from Accept-Language
  const detected = detectCurrencyFromAcceptLanguage(acceptLanguage)
  if (enabledCurrencies.includes(detected)) {
    return { code: detected, source: 'browser' }
  }

  // Fall back to default
  const defaultCurrency = enabledCurrencies.includes(DEFAULT_CURRENCY_CODE)
    ? DEFAULT_CURRENCY_CODE
    : enabledCurrencies[0] || DEFAULT_CURRENCY_CODE

  return { code: defaultCurrency, source: 'default' }
}

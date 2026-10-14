/**
 * Currency Resolution
 *
 * Decides which currency a page renders in from the raw `preferred-currency`
 * cookie. The proxy only checks the cookie is shaped like an ISO code, so every
 * server read must also confirm the code is enabled (and therefore has an
 * exchange rate) before handing it to CurrencyProvider.
 */

import { isWellFormedCurrencyCode } from './detect'
import type { CurrencyInfo } from './types'

/**
 * Whether a code is in the enabled currency list
 */
export function isEnabledCurrency(
  code: string | null | undefined,
  enabledCurrencies: readonly CurrencyInfo[]
): boolean {
  if (!code) return false
  return enabledCurrencies.some((c) => c.code === code)
}

/**
 * Pick the currency to render from the cookie value
 *
 * @param cookieValue - Raw `preferred-currency` cookie value
 * @param enabledCurrencies - Currencies enabled in settings
 * @param defaultCurrency - Platform default currency code
 * @returns The cookie code when it is enabled, otherwise the default
 */
export function resolveCurrentCurrency(
  cookieValue: string | null | undefined,
  enabledCurrencies: readonly CurrencyInfo[],
  defaultCurrency: string
): string {
  if (!cookieValue || !isWellFormedCurrencyCode(cookieValue)) {
    return defaultCurrency
  }

  // No list to check against: keep the user's choice rather than reset it
  if (enabledCurrencies.length === 0) {
    return cookieValue
  }

  return isEnabledCurrency(cookieValue, enabledCurrencies) ? cookieValue : defaultCurrency
}

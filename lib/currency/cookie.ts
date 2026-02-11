/**
 * Currency Cookie Utilities
 *
 * Utilities for managing currency preference in cookies.
 * Works with both server-side (cookies()) and client-side (document.cookie).
 */

import { CURRENCY_COOKIE_NAME, CURRENCY_COOKIE_MAX_AGE } from './types'

/**
 * Cookie options for currency preference
 */
export const CURRENCY_COOKIE_OPTIONS = {
  name: CURRENCY_COOKIE_NAME,
  maxAge: CURRENCY_COOKIE_MAX_AGE,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // Allow client-side access
}

/**
 * Get currency from cookie (server-side)
 *
 * @param cookies - Next.js cookies() function result
 * @returns Currency code or null
 */
export function getCurrencyFromCookies(
  cookies: { get: (name: string) => { value: string } | undefined }
): string | null {
  const cookie = cookies.get(CURRENCY_COOKIE_NAME)
  return cookie?.value || null
}

/**
 * Set currency in cookie (server-side)
 *
 * @param cookies - Next.js cookies() function result
 * @param currencyCode - Currency code to set
 */
export function setCurrencyInCookies(
  cookies: { set: (name: string, value: string, options?: Record<string, any>) => void },
  currencyCode: string
): void {
  cookies.set(CURRENCY_COOKIE_NAME, currencyCode, {
    maxAge: CURRENCY_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  })
}

/**
 * Get currency from cookie (client-side)
 *
 * @returns Currency code or null
 */
export function getCurrencyFromClientCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CURRENCY_COOKIE_NAME) {
      return value || null
    }
  }
  return null
}

/**
 * Set currency in cookie (client-side)
 *
 * @param currencyCode - Currency code to set
 */
export function setCurrencyInClientCookie(currencyCode: string): void {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CURRENCY_COOKIE_NAME}=${currencyCode}; Max-Age=${CURRENCY_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`
}

/**
 * Clear currency cookie (client-side)
 */
export function clearCurrencyCookie(): void {
  if (typeof document === 'undefined') return

  document.cookie = `${CURRENCY_COOKIE_NAME}=; Max-Age=0; Path=/`
}

/**
 * Serialize cookie for Set-Cookie header
 *
 * @param currencyCode - Currency code to set
 * @returns Cookie string for Set-Cookie header
 */
export function serializeCurrencyCookie(currencyCode: string): string {
  const parts = [
    `${CURRENCY_COOKIE_NAME}=${currencyCode}`,
    `Max-Age=${CURRENCY_COOKIE_MAX_AGE}`,
    `Path=/`,
    `SameSite=Lax`,
  ]

  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure')
  }

  return parts.join('; ')
}

import { getUserCurrency, isWellFormedCurrencyCode } from '@/lib/currency/detect'
import { isEnabledCurrency, resolveCurrentCurrency } from '@/lib/currency/resolve'
import type { CurrencyInfo } from '@/lib/currency/types'

function currency(code: string): CurrencyInfo {
  return { code, name: code, symbol: code, decimalPlaces: 2, isDefault: code === 'AED', isFeatured: false }
}

/**
 * Mirrors the live enabled set: the 11 original codes plus the expanded ones
 * (SEK, NOK, KWD, CLP...) that the proxy used to reject and reset.
 */
const ENABLED = ['AED', 'USD', 'EUR', 'JPY', 'SEK', 'NOK', 'DKK', 'KWD', 'CLP', 'IDR', 'KRW', 'TRY', 'ZAR'].map(currency)

describe('isWellFormedCurrencyCode', () => {
  it.each(['SEK', 'NOK', 'KWD', 'CLP', 'AED', 'USD'])('accepts %s', (code) => {
    expect(isWellFormedCurrencyCode(code)).toBe(true)
  })

  it.each(['', 'sek', 'SEKX', 'SE', 'S3K', '<script>', 'SEK;'])('rejects %p', (code) => {
    expect(isWellFormedCurrencyCode(code)).toBe(false)
  })
})

describe('resolveCurrentCurrency', () => {
  it.each(['SEK', 'NOK', 'KWD', 'CLP', 'USD', 'EUR'])('keeps enabled cookie value %s', (code) => {
    expect(resolveCurrentCurrency(code, ENABLED, 'AED')).toBe(code)
  })

  it('falls back to the default when the cookie code is not enabled', () => {
    expect(resolveCurrentCurrency('XAF', ENABLED, 'AED')).toBe('AED')
  })

  it('falls back to the default for a malformed cookie value', () => {
    expect(resolveCurrentCurrency('garbage', ENABLED, 'AED')).toBe('AED')
  })

  it('falls back to the default when there is no cookie', () => {
    expect(resolveCurrentCurrency(undefined, ENABLED, 'AED')).toBe('AED')
    expect(resolveCurrentCurrency(null, ENABLED, 'AED')).toBe('AED')
    expect(resolveCurrentCurrency('', ENABLED, 'AED')).toBe('AED')
  })

  it('trusts the cookie when the enabled list failed to load', () => {
    expect(resolveCurrentCurrency('SEK', [], 'AED')).toBe('SEK')
    expect(resolveCurrentCurrency('garbage', [], 'AED')).toBe('AED')
  })
})

describe('isEnabledCurrency', () => {
  it('matches only codes in the list', () => {
    expect(isEnabledCurrency('SEK', ENABLED)).toBe(true)
    expect(isEnabledCurrency('XAF', ENABLED)).toBe(false)
    expect(isEnabledCurrency(null, ENABLED)).toBe(false)
  })
})

describe('getUserCurrency', () => {
  const enabledCodes = ENABLED.map((c) => c.code)

  it('honours an enabled cookie code outside the original 11', () => {
    expect(getUserCurrency('SEK', 'en-US', enabledCodes)).toEqual({ code: 'SEK', source: 'cookie' })
  })

  it('ignores a cookie code that is not enabled', () => {
    expect(getUserCurrency('XAF', 'en-US', enabledCodes)).toEqual({ code: 'USD', source: 'browser' })
  })
})

/**
 * The cancellation window as a stored setting.
 *
 * Worth testing separately from the eligibility rule because the failure mode is
 * silent and site-wide: `business_cancellation_window_minutes` reaching
 * `getCancellationEligibility` as 0, a negative, or a NaN switches business
 * self-cancellation off for every tenant, and nothing on screen says why.
 *
 * The first case is not hypothetical. The live `site_settings` row predates this
 * key and does not contain it, so every read on deploy takes the default branch.
 */

import {
  DEFAULT_CANCELLATION_WINDOW_MINUTES,
  DEFAULT_SITE_SETTINGS,
  parseSiteSettings,
} from '@/lib/site-settings/types'

const windowOf = (raw: unknown) =>
  parseSiteSettings(raw).business_cancellation_window_minutes

describe('reading the window out of a stored config', () => {
  it('defaults when the key is absent, which is the live row today', () => {
    expect(windowOf({ brand_name: 'Infinia Transfers', timezone: 'Asia/Dubai' })).toBe(
      DEFAULT_CANCELLATION_WINDOW_MINUTES
    )
  })

  it('defaults on an empty config rather than disabling cancellation', () => {
    expect(windowOf({})).toBe(DEFAULT_CANCELLATION_WINDOW_MINUTES)
  })

  it('defaults when the whole config is missing', () => {
    expect(windowOf(null)).toBe(DEFAULT_CANCELLATION_WINDOW_MINUTES)
  })

  it('reads a stored value', () => {
    expect(windowOf({ business_cancellation_window_minutes: 45 })).toBe(45)
  })

  it('keeps 0, because that is a deliberate kill switch and not a missing value', () => {
    expect(windowOf({ business_cancellation_window_minutes: 0 })).toBe(0)
  })
})

describe('values that would silently disable cancellation are rejected', () => {
  it.each([
    ['a negative', -30],
    ['a string', '30'],
    ['a NaN', Number.NaN],
    ['an Infinity', Number.POSITIVE_INFINITY],
    ['a boolean', true],
    ['null', null],
  ])('falls back on %s', (_label, value) => {
    expect(windowOf({ business_cancellation_window_minutes: value })).toBe(
      DEFAULT_CANCELLATION_WINDOW_MINUTES
    )
  })

  it('floors a float rather than carrying fractional minutes', () => {
    expect(windowOf({ business_cancellation_window_minutes: 30.9 })).toBe(30)
  })
})

describe('the default itself', () => {
  it('is a positive whole number of minutes', () => {
    expect(Number.isInteger(DEFAULT_CANCELLATION_WINDOW_MINUTES)).toBe(true)
    expect(DEFAULT_CANCELLATION_WINDOW_MINUTES).toBeGreaterThan(0)
  })

  it('is what DEFAULT_SITE_SETTINGS carries, so the two cannot drift', () => {
    expect(DEFAULT_SITE_SETTINGS.business_cancellation_window_minutes).toBe(
      DEFAULT_CANCELLATION_WINDOW_MINUTES
    )
  })
})

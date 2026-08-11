/**
 * The bridge between the stored setting and the date helpers.
 *
 * Tested here rather than in a browser because the browser cannot show it:
 * `getSiteSettings` is wrapped in `unstable_cache` with an hour-long TTL, so a
 * change only reaches a running server when the admin action revalidates the
 * `site-settings` tag. Stubbing the read is the only way to exercise the wiring
 * deterministically.
 */

import {
  DEFAULT_BOOKING_TIMEZONE,
  formatBookingDateTime,
  getBookingTimezone,
  setBookingTimezone,
} from '@/lib/utils/timezone'

const getSiteSettings = jest.fn()

// Virtual: the real package resolves only under the react-server condition,
// which jest does not run in.
jest.mock('server-only', () => ({}), { virtual: true })
jest.mock('@/lib/site-settings/server', () => ({
  getSiteSettings: () => getSiteSettings(),
}))

// Required rather than imported so it resolves after the mock is registered.
const { loadBookingTimezone } = require('@/lib/site-settings/timezone')

/** 21:30Z: already the 12th in Dubai, still the 11th in London and New York. */
const INSTANT = '2026-08-11T21:30:00.000Z'

describe('loadBookingTimezone', () => {
  beforeEach(() => {
    setBookingTimezone(DEFAULT_BOOKING_TIMEZONE)
    getSiteSettings.mockReset()
  })

  afterAll(() => setBookingTimezone(DEFAULT_BOOKING_TIMEZONE))

  it('applies the stored zone to the date helpers', async () => {
    getSiteSettings.mockResolvedValue({ timezone: 'America/New_York' })

    await expect(loadBookingTimezone()).resolves.toBe('America/New_York')
    expect(getBookingTimezone()).toBe('America/New_York')
  })

  it('changes what every downstream date renders, which is the point', async () => {
    getSiteSettings.mockResolvedValue({ timezone: 'Asia/Dubai' })
    await loadBookingTimezone()
    expect(formatBookingDateTime(INSTANT)).toBe('12 Aug 2026 at 01:30')

    getSiteSettings.mockResolvedValue({ timezone: 'America/New_York' })
    await loadBookingTimezone()
    expect(formatBookingDateTime(INSTANT)).toBe('11 Aug 2026 at 17:30')

    getSiteSettings.mockResolvedValue({ timezone: 'Europe/London' })
    await loadBookingTimezone()
    expect(formatBookingDateTime(INSTANT)).toBe('11 Aug 2026 at 22:30')
  })

  it('falls back to the default when the stored value is unusable', async () => {
    getSiteSettings.mockResolvedValue({ timezone: 'Mars/Olympus_Mons' })
    await loadBookingTimezone()
    expect(getBookingTimezone()).toBe(DEFAULT_BOOKING_TIMEZONE)

    getSiteSettings.mockResolvedValue({ timezone: null })
    await loadBookingTimezone()
    expect(getBookingTimezone()).toBe(DEFAULT_BOOKING_TIMEZONE)
  })
})

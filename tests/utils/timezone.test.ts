import {
  DEFAULT_BOOKING_TIMEZONE,
  bookingDayKey,
  bookingDaysAgoUtc,
  bookingOffsetMinutesAt,
  bookingRelativeTime,
  bookingToday,
  bookingWallClockToUtc,
  formatBookingDate,
  formatBookingDateTime,
  formatBookingTime,
  getBookingTimezone,
  setBookingTimezone,
  startOfBookingMonthUtc,
} from '@/lib/utils/timezone'

/**
 * The instants that matter are the ones inside the first four hours of a Dubai
 * day, because that is where the UTC day and the Dubai day disagree and where
 * every bug this module exists to prevent actually bites.
 */
const EARLY_DUBAI = '2026-08-11T21:30:00.000Z' // 01:30 on 12 Aug in Dubai
const LATE_DUBAI = '2026-08-11T19:00:00.000Z' // 23:00 on 11 Aug in Dubai

describe('bookingDayKey', () => {
  it('reports the Dubai day, not the UTC one', () => {
    // 21:30Z is still 11 August in UTC but already the 12th in Dubai.
    expect(bookingDayKey(EARLY_DUBAI)).toBe('2026-08-12')
    expect(EARLY_DUBAI.slice(0, 10)).toBe('2026-08-11')
  })

  it('keeps a late-evening Dubai instant on the same day', () => {
    expect(bookingDayKey(LATE_DUBAI)).toBe('2026-08-11')
  })

  it('accepts a Date as well as an ISO string', () => {
    expect(bookingDayKey(new Date(EARLY_DUBAI))).toBe('2026-08-12')
  })

  it('returns an empty string rather than throwing on missing input', () => {
    expect(bookingDayKey(null)).toBe('')
    expect(bookingDayKey(undefined)).toBe('')
    expect(bookingDayKey('not-a-date')).toBe('')
  })
})

describe('bookingToday', () => {
  it('agrees with bookingDayKey for the current instant', () => {
    expect(bookingToday()).toBe(bookingDayKey(new Date()))
  })

  it('is a yyyy-MM-dd string', () => {
    expect(bookingToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('display formatting', () => {
  it('formats a stored instant as Dubai wall-clock', () => {
    expect(formatBookingDate(EARLY_DUBAI)).toBe('12 Aug 2026')
    expect(formatBookingDateTime(EARLY_DUBAI)).toBe('12 Aug 2026 at 01:30')
    expect(formatBookingTime(EARLY_DUBAI)).toBe('01:30')
  })

  it('does not drift with the machine timezone', () => {
    // The offset is what makes this meaningful: 21:30Z is 01:30 Dubai
    // regardless of where the process or the viewer sits.
    expect(formatBookingTime(LATE_DUBAI)).toBe('23:00')
  })

  it('honours a custom pattern', () => {
    expect(formatBookingDate(EARLY_DUBAI, 'yyyy-MM-dd')).toBe('2026-08-12')
  })

  it('degrades to an empty string instead of "Invalid Date"', () => {
    expect(formatBookingDate(null)).toBe('')
    expect(formatBookingDateTime(undefined)).toBe('')
    expect(formatBookingTime('')).toBe('')
    expect(formatBookingDate('nonsense')).toBe('')
  })
})

describe('bookingRelativeTime', () => {
  const now = new Date('2026-08-11T12:00:00.000Z')

  it('describes recent gaps in words', () => {
    expect(bookingRelativeTime('2026-08-11T11:59:40.000Z', now)).toBe('just now')
    expect(bookingRelativeTime('2026-08-11T11:45:00.000Z', now)).toBe('15m ago')
    expect(bookingRelativeTime('2026-08-11T09:00:00.000Z', now)).toBe('3h ago')
  })

  it('falls back to an absolute Dubai timestamp past a day', () => {
    // 2026-08-09T09:00Z is 13:00 Dubai on the 9th.
    expect(bookingRelativeTime('2026-08-09T09:00:00.000Z', now)).toBe('9 Aug, 13:00')
  })

  it('returns an empty string on missing input', () => {
    expect(bookingRelativeTime(null, now)).toBe('')
  })
})

describe('window boundaries', () => {
  it('resolves Dubai midnight, which is 20:00Z the evening before', () => {
    expect(bookingDaysAgoUtc(0, '2026-08-11').toISOString()).toBe('2026-08-10T20:00:00.000Z')
  })

  it('counts back in whole Dubai days across a month boundary', () => {
    // 11 days before 11 Aug is 31 July, whose Dubai midnight is 30 July 20:00Z.
    expect(bookingDaysAgoUtc(11, '2026-08-11').toISOString()).toBe('2026-07-30T20:00:00.000Z')
  })

  it('starts the month at Dubai midnight on the first', () => {
    expect(startOfBookingMonthUtc('2026-08-11').toISOString()).toBe('2026-07-31T20:00:00.000Z')
  })

  it('puts an early-morning Dubai instant inside the current Dubai month', () => {
    // 2026-07-31T21:00Z is 01:00 on 1 August in Dubai. A UTC month boundary
    // would wrongly file it under July.
    const firstOfAugustDubai = new Date('2026-07-31T21:00:00.000Z')
    expect(firstOfAugustDubai >= startOfBookingMonthUtc('2026-08-01')).toBe(true)
  })

  it('agrees with bookingWallClockToUtc', () => {
    expect(bookingDaysAgoUtc(3, '2026-08-11').toISOString()).toBe(
      bookingWallClockToUtc('2026-08-08', '00:00').toISOString()
    )
  })
})

describe('module constants', () => {
  it('defaults to Dubai until the stored setting says otherwise', () => {
    expect(DEFAULT_BOOKING_TIMEZONE).toBe('Asia/Dubai')
    expect(getBookingTimezone()).toBe('Asia/Dubai')
  })
})

/**
 * The zone is admin-configurable, so the arithmetic can no longer assume a
 * fixed +04:00. These pin the behaviour that assumption used to hide: a zone
 * that observes DST, either side of a transition.
 */
describe('a configurable timezone', () => {
  afterEach(() => setBookingTimezone(DEFAULT_BOOKING_TIMEZONE))

  it('refuses a zone the runtime cannot resolve, rather than throwing later', () => {
    setBookingTimezone('Mars/Olympus_Mons')
    expect(getBookingTimezone()).toBe('Asia/Dubai')

    setBookingTimezone(null)
    expect(getBookingTimezone()).toBe('Asia/Dubai')
  })

  it('moves the calendar day with the zone', () => {
    // 21:30Z is already the 12th in Dubai but still the 11th in London.
    setBookingTimezone('Europe/London')
    expect(bookingDayKey(EARLY_DUBAI)).toBe('2026-08-11')

    setBookingTimezone('Asia/Dubai')
    expect(bookingDayKey(EARLY_DUBAI)).toBe('2026-08-12')
  })

  it('resolves wall-clock across a DST transition, which a fixed offset cannot', () => {
    setBookingTimezone('Europe/London')

    // BST, +01:00.
    expect(bookingWallClockToUtc('2026-08-11', '12:00').toISOString()).toBe(
      '2026-08-11T11:00:00.000Z'
    )
    // GMT, +00:00. A hardcoded offset would put this an hour out.
    expect(bookingWallClockToUtc('2026-01-11', '12:00').toISOString()).toBe(
      '2026-01-11T12:00:00.000Z'
    )
  })

  it('keeps Dubai exactly where the old fixed-offset code put it', () => {
    expect(bookingWallClockToUtc('2026-08-11', '00:00').toISOString()).toBe(
      new Date('2026-08-11T00:00:00+04:00').toISOString()
    )
    expect(bookingWallClockToUtc('2026-01-11', '08:30').toISOString()).toBe(
      new Date('2026-01-11T08:30:00+04:00').toISOString()
    )
  })

  it('reports the offset it measured', () => {
    expect(bookingOffsetMinutesAt(new Date(EARLY_DUBAI))).toBe(240)

    setBookingTimezone('Europe/London')
    expect(bookingOffsetMinutesAt(new Date('2026-08-11T12:00:00Z'))).toBe(60)
    expect(bookingOffsetMinutesAt(new Date('2026-01-11T12:00:00Z'))).toBe(0)
  })
})

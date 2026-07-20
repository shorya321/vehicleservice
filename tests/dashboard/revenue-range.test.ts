import {
  MAX_BUCKETS,
  addDays,
  addMonths,
  bucketKeyForDubaiDay,
  buildBuckets,
  dubaiDayFromIso,
  isValidDay,
  presetForPeriod,
  resolveRevenueRange,
  startOfWeek,
  toUtcBounds,
} from '@/lib/dashboard/revenue-range'

/** Fixed "today" so results don't drift with the real clock. */
const TODAY = '2026-07-20'

describe('calendar helpers', () => {
  it('adds days across a month boundary', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('clamps month arithmetic to the shorter target month', () => {
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonths('2024-03-31', -1)).toBe('2024-02-29') // leap year
  })

  it('treats Monday as the start of the week', () => {
    expect(startOfWeek('2026-07-20')).toBe('2026-07-20') // a Monday
    expect(startOfWeek('2026-07-26')).toBe('2026-07-20') // the Sunday after
    expect(startOfWeek('2026-07-19')).toBe('2026-07-13') // previous Sunday
  })

  it('rejects impossible dates instead of rolling them over', () => {
    expect(isValidDay('2025-02-30')).toBe(false)
    expect(isValidDay('2025-13-01')).toBe(false)
    expect(isValidDay('not-a-date')).toBe(false)
    expect(isValidDay(undefined)).toBe(false)
    expect(isValidDay('2025-02-28')).toBe(true)
  })
})

describe('dubaiDayFromIso', () => {
  it('maps an instant to the Dubai calendar day, not the UTC one', () => {
    // 22:00 UTC is already 02:00 the next day in Dubai (+04:00).
    expect(dubaiDayFromIso('2026-07-19T22:00:00.000Z')).toBe('2026-07-20')
    expect(dubaiDayFromIso('2026-07-20T19:59:59.000Z')).toBe('2026-07-20')
    expect(dubaiDayFromIso('2026-07-20T20:00:00.000Z')).toBe('2026-07-21')
  })

  it('keeps the early-morning Dubai hours on the correct day', () => {
    // 01:00 Dubai == 21:00 UTC the previous day. Naive UTC bucketing would
    // push this into the wrong day.
    expect(dubaiDayFromIso('2026-07-07T21:00:00.000Z')).toBe('2026-07-08')
  })
})

describe('toUtcBounds', () => {
  it('uses an exclusive upper bound so the final day is fully included', () => {
    const { fromUtc, toUtcExclusive } = toUtcBounds({ from: '2026-07-01', to: '2026-07-31' })

    // Dubai midnight is 20:00 UTC the previous day.
    expect(fromUtc.toISOString()).toBe('2026-06-30T20:00:00.000Z')
    expect(toUtcExclusive.toISOString()).toBe('2026-07-31T20:00:00.000Z')
  })

  it('includes a booking made late on the last day of the range', () => {
    const { toUtcExclusive } = toUtcBounds({ from: '2026-07-01', to: '2026-07-31' })
    // 23:30 Dubai on Jul 31 == 19:30 UTC on Jul 31.
    const lateBooking = new Date('2026-07-31T19:30:00.000Z')

    expect(lateBooking.getTime()).toBeLessThan(toUtcExclusive.getTime())
  })
})

describe('bucketKeyForDubaiDay', () => {
  it('buckets a last-day-of-month booking into that month, not the next', () => {
    expect(bucketKeyForDubaiDay('2026-07-31', 'month')).toBe('2026-07')
    expect(bucketKeyForDubaiDay('2026-07-01', 'month')).toBe('2026-07')
  })

  it('buckets by unit', () => {
    expect(bucketKeyForDubaiDay('2026-07-22', 'day')).toBe('2026-07-22')
    expect(bucketKeyForDubaiDay('2026-07-22', 'week')).toBe('2026-07-20')
  })
})

describe('resolveRevenueRange presets', () => {
  it('defaults to last 7 days, preserving the previous default view', () => {
    const range = resolveRevenueRange({}, TODAY)

    expect(range.preset).toBe('last7d')
    expect(range.from).toBe('2026-07-14')
    expect(range.to).toBe(TODAY)
    expect(range.bucket).toBe('day')
    expect(buildBuckets(range)).toHaveLength(7)
  })

  it('resolves last 12 months to 12 month buckets', () => {
    const range = resolveRevenueRange({ preset: 'last12m' }, TODAY)

    expect(range.from).toBe('2025-08-01')
    expect(range.to).toBe(TODAY)
    expect(range.bucket).toBe('month')
    expect(buildBuckets(range)).toHaveLength(12)
  })

  it('labels months with a year when the range crosses one', () => {
    const range = resolveRevenueRange({ preset: 'last12m' }, TODAY)
    const labels = buildBuckets(range).map((bucket) => bucket.label)

    expect(range.crossesYear).toBe(true)
    expect(labels[0]).toBe('Aug 25')
    expect(labels[labels.length - 1]).toBe('Jul 26')
    // No ambiguous duplicates across the year boundary.
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('omits the year when the range stays inside one', () => {
    const range = resolveRevenueRange(
      { from: '2026-02-01', to: '2026-06-30', bucket: 'month' },
      TODAY
    )

    expect(range.crossesYear).toBe(false)
    expect(buildBuckets(range)[0].label).toBe('Feb')
  })

  it('keeps the year when the first bucket starts in the previous one', () => {
    // The week containing Jan 1 2026 starts Dec 29 2025, so these labels
    // genuinely span two years even though from/to do not.
    const range = resolveRevenueRange(
      { from: '2026-01-01', to: '2026-02-15', bucket: 'week' },
      TODAY
    )
    const buckets = buildBuckets(range)

    expect(buckets[0].date).toBe('2025-12-29')
    expect(range.crossesYear).toBe(true)
    expect(buckets[0].label).toBe('29 Dec 25')
  })

  it('resolves a specific past year to whole-year bounds', () => {
    const range = resolveRevenueRange({ preset: 'year:2025' }, TODAY)

    expect(range.from).toBe('2025-01-01')
    expect(range.to).toBe('2025-12-31')
    expect(range.label).toBe('2025')
    expect(buildBuckets(range)).toHaveLength(12)
  })

  it('clamps the current year to today rather than projecting empty future months', () => {
    const range = resolveRevenueRange({ preset: 'year:2026' }, TODAY)

    expect(range.from).toBe('2026-01-01')
    expect(range.to).toBe(TODAY)
    expect(buildBuckets(range)).toHaveLength(7) // Jan–Jul, not 12
  })

  it('falls back to the default for a future or unknown preset', () => {
    expect(resolveRevenueRange({ preset: 'year:2099' }, TODAY).preset).toBe('last7d')
    expect(resolveRevenueRange({ preset: 'nonsense' }, TODAY).preset).toBe('last7d')
  })
})

describe('resolveRevenueRange custom ranges', () => {
  it('accepts an explicit from/to', () => {
    const range = resolveRevenueRange({ from: '2026-07-08', to: '2026-07-17' }, TODAY)

    expect(range.preset).toBe('custom')
    expect(range.bucket).toBe('day')
    expect(buildBuckets(range)).toHaveLength(10)
  })

  it('tolerates a reversed range instead of rendering nothing', () => {
    const range = resolveRevenueRange({ from: '2026-07-17', to: '2026-07-08' }, TODAY)

    expect(range.from).toBe('2026-07-08')
    expect(range.to).toBe('2026-07-17')
  })

  it('ignores a partial custom range and uses the preset', () => {
    const range = resolveRevenueRange({ from: '2026-07-08' }, TODAY)

    expect(range.preset).toBe('last7d')
  })
})

describe('future dates', () => {
  // Booked revenue cannot exist after today. The calendar disables future
  // dates, so these guard hand-edited URLs.
  it('clamps a range that runs past today', () => {
    const range = resolveRevenueRange({ from: '2026-07-01', to: '2026-12-31' }, TODAY)

    expect(range.preset).toBe('custom')
    expect(range.from).toBe('2026-07-01')
    expect(range.to).toBe(TODAY)
  })

  it('falls back to the default when the whole range is in the future', () => {
    const range = resolveRevenueRange({ from: '2027-01-01', to: '2027-12-31' }, TODAY)

    expect(range.preset).toBe('last7d')
    expect(range.to).toBe(TODAY)
  })

  it('never emits a bucket after today', () => {
    for (const input of [
      { from: '2026-07-01', to: '2026-12-31' },
      { preset: 'last12m' },
      { preset: 'year:2026' },
      { preset: 'ytd' },
    ]) {
      const range = resolveRevenueRange(input, TODAY)
      const buckets = buildBuckets(range)

      expect(range.to <= TODAY).toBe(true)
      expect(buckets[buckets.length - 1].date <= TODAY).toBe(true)
    }
  })

  it('leaves a fully past range alone', () => {
    const range = resolveRevenueRange({ preset: 'year:2025' }, TODAY)

    expect(range.from).toBe('2025-01-01')
    expect(range.to).toBe('2025-12-31')
  })
})

describe('bucket sizing', () => {
  it('auto-selects granularity from the span', () => {
    expect(resolveRevenueRange({ from: '2026-07-01', to: '2026-07-20' }, TODAY).bucket).toBe('day')
    expect(resolveRevenueRange({ from: '2026-03-01', to: '2026-07-20' }, TODAY).bucket).toBe('week')
    expect(resolveRevenueRange({ from: '2024-01-01', to: '2026-07-20' }, TODAY).bucket).toBe('month')
  })

  it('coarsens an explicit bucket that would blow past MAX_BUCKETS', () => {
    // Two years of daily bars would be ~730 slivers.
    const range = resolveRevenueRange(
      { from: '2024-07-20', to: '2026-07-20', bucket: 'day' },
      TODAY
    )

    expect(range.bucket).toBe('month')
    expect(range.bucketAdjusted).toBe(true)
    expect(buildBuckets(range).length).toBeLessThanOrEqual(MAX_BUCKETS)
  })

  it('honours an explicit bucket that does fit', () => {
    const range = resolveRevenueRange(
      { from: '2026-07-01', to: '2026-07-20', bucket: 'week' },
      TODAY
    )

    expect(range.bucket).toBe('week')
    expect(range.bucketAdjusted).toBe(false)
  })

  it('never exceeds MAX_BUCKETS even for a very wide range', () => {
    const range = resolveRevenueRange({ from: '2010-01-01', to: '2026-07-20' }, TODAY)

    expect(buildBuckets(range).length).toBeLessThanOrEqual(MAX_BUCKETS)
  })
})

describe('buildBuckets', () => {
  it('emits contiguous buckets with no gaps', () => {
    const range = resolveRevenueRange({ preset: 'last12m' }, TODAY)
    const keys = buildBuckets(range).map((bucket) => bucket.key)

    expect(keys[0]).toBe('2025-08')
    expect(keys).toEqual([...keys].sort())
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('produces keys that match what bucketing a booking date yields', () => {
    const range = resolveRevenueRange({ preset: 'last12m' }, TODAY)
    const keys = new Set(buildBuckets(range).map((bucket) => bucket.key))
    const bookingDay = dubaiDayFromIso('2026-07-08T12:46:19.226Z')

    expect(keys.has(bucketKeyForDubaiDay(bookingDay, range.bucket))).toBe(true)
  })
})

describe('legacy PeriodType alias', () => {
  it('maps the old period names onto presets', () => {
    expect(presetForPeriod('daily')).toBe('last7d')
    expect(presetForPeriod('weekly')).toBe('last8w')
    expect(presetForPeriod('monthly')).toBe('last12m')
  })

  it('keeps the old monthly view at 12 month buckets', () => {
    const range = resolveRevenueRange({ preset: presetForPeriod('monthly') }, TODAY)

    expect(range.bucket).toBe('month')
    expect(buildBuckets(range)).toHaveLength(12)
  })

  it('keeps the old weekly view at 8 week buckets', () => {
    const range = resolveRevenueRange({ preset: presetForPeriod('weekly') }, TODAY)

    expect(range.bucket).toBe('week')
    expect(buildBuckets(range)).toHaveLength(8)
  })
})

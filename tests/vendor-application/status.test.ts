import {
  APPLICATION_STATUS_LABEL,
  decisionDueAt,
  expiryState,
  formatCalendarDate,
  maskTail,
  normalizeApplicationStatus,
  REVIEW_WINDOW_HOURS,
} from '@/lib/vendor-application/status'

// jest.config.js pins TZ=UTC, and the operating timezone is Asia/Dubai (UTC+4), so any test that
// straddles a day boundary would fail here first rather than on Vercel.

describe('normalizeApplicationStatus', () => {
  it.each(['pending', 'approved', 'rejected'] as const)('passes %s through', (status) => {
    expect(normalizeApplicationStatus(status)).toBe(status)
  })

  it('falls back to pending for anything the CHECK constraint does not allow', () => {
    expect(normalizeApplicationStatus('under_review')).toBe('pending')
    expect(normalizeApplicationStatus(null)).toBe('pending')
    expect(normalizeApplicationStatus(undefined)).toBe('pending')
  })
})

describe('APPLICATION_STATUS_LABEL', () => {
  it('never prints raw database casing', () => {
    expect(APPLICATION_STATUS_LABEL.pending).toBe('In review')
    expect(APPLICATION_STATUS_LABEL.approved).toBe('Approved')
    expect(APPLICATION_STATUS_LABEL.rejected).toBe('Not approved')
  })
})

describe('decisionDueAt', () => {
  it('adds the quoted review window as elapsed time', () => {
    const created = '2026-09-03T10:43:46.768Z'
    const due = decisionDueAt(created)

    expect(due.getTime() - new Date(created).getTime()).toBe(REVIEW_WINDOW_HOURS * 60 * 60 * 1000)
    expect(due.toISOString()).toBe('2026-09-05T10:43:46.768Z')
  })
})

describe('maskTail', () => {
  it('keeps only the last four characters', () => {
    expect(maskTail('AE070331234567890123456')).toBe('···· 3456')
    expect(maskTail('12345678')).toBe('···· 5678')
  })

  it('ignores spacing in a grouped IBAN', () => {
    expect(maskTail('AE07 0331 2345 6789 0123 456')).toBe('···· 3456')
  })

  it('returns a short value whole rather than masking it to nothing', () => {
    expect(maskTail('4471')).toBe('4471')
    expect(maskTail('12')).toBe('12')
  })

  it('returns null for the empty values the live rows actually carry', () => {
    expect(maskTail(null)).toBeNull()
    expect(maskTail(undefined)).toBeNull()
    expect(maskTail('')).toBeNull()
    expect(maskTail('   ')).toBeNull()
  })
})

describe('formatCalendarDate', () => {
  it('round-trips a stored yyyy-MM-dd without shifting the day', () => {
    expect(formatCalendarDate('2028-09-20')).toBe('20 Sep 2028')
    expect(formatCalendarDate('2026-01-01')).toBe('01 Jan 2026')
    expect(formatCalendarDate('2026-12-31')).toBe('31 Dec 2026')
  })

  it('returns null for missing or unparseable values', () => {
    expect(formatCalendarDate(null)).toBeNull()
    expect(formatCalendarDate(undefined)).toBeNull()
    expect(formatCalendarDate('not-a-date')).toBeNull()
  })
})

describe('expiryState', () => {
  const realNow = Date.now

  afterEach(() => {
    Date.now = realNow
    jest.useRealTimers()
  })

  function freezeAt(iso: string) {
    jest.useFakeTimers().setSystemTime(new Date(iso))
  }

  it('says nothing beyond sixty days', () => {
    freezeAt('2026-09-03T06:00:00Z')
    expect(expiryState('2028-09-20')).toEqual({ kind: 'clear' })
  })

  it('warns inside sixty days', () => {
    freezeAt('2026-09-03T06:00:00Z')
    expect(expiryState('2026-10-03')).toEqual({ kind: 'due', label: 'Expires in 30 days' })
  })

  it('names today and tomorrow rather than counting them', () => {
    freezeAt('2026-09-03T06:00:00Z')
    expect(expiryState('2026-09-03')).toEqual({ kind: 'due', label: 'Expires today' })
    expect(expiryState('2026-09-04')).toEqual({ kind: 'due', label: 'Expires tomorrow' })
  })

  it('flags a lapsed document', () => {
    freezeAt('2026-09-03T06:00:00Z')
    expect(expiryState('2026-09-02')).toEqual({ kind: 'lapsed', label: 'Lapsed' })
  })

  it('resolves the boundary on the operating timezone, not UTC', () => {
    // 21:00 UTC on 2 Sep is already 3 Sep in Asia/Dubai. A licence expiring on 2 Sep has
    // therefore lapsed, which a UTC-based comparison would miss.
    freezeAt('2026-09-02T21:00:00Z')
    expect(expiryState('2026-09-02')).toEqual({ kind: 'lapsed', label: 'Lapsed' })
    expect(expiryState('2026-09-03')).toEqual({ kind: 'due', label: 'Expires today' })
  })

  it('stays quiet with nothing to check', () => {
    expect(expiryState(null)).toEqual({ kind: 'clear' })
    expect(expiryState(undefined)).toEqual({ kind: 'clear' })
  })
})

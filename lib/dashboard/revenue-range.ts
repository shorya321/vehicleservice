/**
 * Date-range and bucketing logic for the admin revenue chart.
 *
 * Pure module: no Supabase, no React, no I/O. All calendar arithmetic is done
 * in explicit UTC so results never depend on the timezone the server happens
 * to run in (UTC on Vercel, local in dev).
 *
 * Ranges are expressed as inclusive `yyyy-MM-dd` *Dubai calendar days*, the
 * same convention `app/admin/bookings/components/booking-filters.tsx` uses for
 * its filters. Passing ISO instants instead would make day boundaries shift
 * per viewer.
 */

const MS_PER_DAY = 86_400_000

/** Asia/Dubai is a fixed +04:00 with no DST — see `lib/utils/timezone.ts`. */
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Bars stop being readable past this many in a flex row. */
export const MAX_BUCKETS = 60

/** Widest range we will resolve, to keep the JS-side aggregation bounded. */
const MAX_RANGE_DAYS = 366 * 5

export const DEFAULT_PRESET = 'last7d'

export type BucketUnit = 'day' | 'week' | 'month'

export interface RevenueRange {
  /** Inclusive Dubai calendar day, `yyyy-MM-dd`. */
  from: string
  /** Inclusive Dubai calendar day, `yyyy-MM-dd`. */
  to: string
  bucket: BucketUnit
  preset: string
  label: string
  /** True when the range spans more than one calendar year, so labels need a year. */
  crossesYear: boolean
  /** Set when the requested bucket was coarsened to stay under MAX_BUCKETS. */
  bucketAdjusted: boolean
}

export interface RevenueRangeInput {
  preset?: string
  from?: string
  to?: string
  bucket?: string
}

export interface RevenueBucket {
  key: string
  date: string
  label: string
}

/**
 * Chart-facing result types.
 *
 * These live here rather than in `app/admin/dashboard/actions.ts` because a
 * `'use server'` module may only export async functions — exporting types from
 * it breaks the server-action compiler.
 */
export interface RevenueTrendPoint {
  date: string
  label: string
  revenue: number
}

export interface RevenueTrendMeta {
  range: RevenueRange
  totalRows: number
  /** True when the row cap was hit, so the totals under-report. */
  truncated: boolean
  /** False when the table holds no bookings at all, vs none in this range. */
  hasAnyHistory: boolean
  includedPaymentStatuses: string[]
  error: string | null
}

export interface RevenueTrendResult {
  points: RevenueTrendPoint[]
  meta: RevenueTrendMeta
}

// --- UTC calendar helpers -------------------------------------------------

function dayToUtc(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`)
}

function utcToDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function isValidDay(day: string | undefined): day is string {
  if (!day || !DAY_PATTERN.test(day)) return false
  const parsed = dayToUtc(day)
  // Rejects impossible dates like 2025-02-30, which Date would roll over.
  return !Number.isNaN(parsed.getTime()) && utcToDay(parsed) === day
}

export function addDays(day: string, amount: number): string {
  return utcToDay(new Date(dayToUtc(day).getTime() + amount * MS_PER_DAY))
}

export function addMonths(day: string, amount: number): string {
  const date = dayToUtc(day)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))
  const lastDayOfTarget = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate()
  target.setUTCDate(Math.min(date.getUTCDate(), lastDayOfTarget))
  return utcToDay(target)
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`
}

/** ISO week start (Monday). */
export function startOfWeek(day: string): string {
  const dayOfWeek = dayToUtc(day).getUTCDay() // 0 = Sunday
  return addDays(day, -((dayOfWeek + 6) % 7))
}

export function daysBetween(from: string, to: string): number {
  return Math.round((dayToUtc(to).getTime() - dayToUtc(from).getTime()) / MS_PER_DAY)
}

// --- Dubai-day mapping ----------------------------------------------------

/**
 * The Dubai calendar day a stored UTC instant falls on.
 *
 * Shifting by a fixed offset is exact for Asia/Dubai (no DST) and avoids an
 * Intl allocation per booking row.
 */
export function dubaiDayFromIso(iso: string): string {
  const instant = new Date(iso).getTime()
  if (Number.isNaN(instant)) return ''
  return new Date(instant + DUBAI_OFFSET_MS).toISOString().slice(0, 10)
}

export function bucketKeyForDubaiDay(day: string, unit: BucketUnit): string {
  if (unit === 'month') return day.slice(0, 7)
  if (unit === 'week') return startOfWeek(day)
  return day
}

/**
 * Half-open UTC bounds for a range: `[fromUtc, toUtcExclusive)`.
 *
 * The upper bound is the start of the day *after* `to`, so bookings made
 * during the final day are included. An inclusive `<=` bound against midnight
 * silently drops everything after 00:00:00 on that day.
 */
export function toUtcBounds(range: Pick<RevenueRange, 'from' | 'to'>): {
  fromUtc: Date
  toUtcExclusive: Date
} {
  return {
    fromUtc: new Date(dayToUtc(range.from).getTime() - DUBAI_OFFSET_MS),
    toUtcExclusive: new Date(dayToUtc(addDays(range.to, 1)).getTime() - DUBAI_OFFSET_MS),
  }
}

// --- Bucketing ------------------------------------------------------------

function bucketCount(from: string, to: string, unit: BucketUnit): number {
  const spanDays = daysBetween(from, to) + 1
  if (unit === 'day') return spanDays
  if (unit === 'week') return Math.ceil((daysBetween(startOfWeek(from), to) + 1) / 7)
  const fromDate = dayToUtc(from)
  const toDate = dayToUtc(to)
  return (
    (toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12 +
    (toDate.getUTCMonth() - fromDate.getUTCMonth()) +
    1
  )
}

function autoBucket(from: string, to: string): BucketUnit {
  const spanDays = daysBetween(from, to) + 1
  if (spanDays <= 31) return 'day'
  if (spanDays <= 182) return 'week'
  return 'month'
}

/** Coarsens the unit until the range fits within MAX_BUCKETS. */
function fitBucket(from: string, to: string, requested: BucketUnit): BucketUnit {
  const order: BucketUnit[] = ['day', 'week', 'month']
  let index = order.indexOf(requested)
  while (index < order.length - 1 && bucketCount(from, to, order[index]) > MAX_BUCKETS) {
    index += 1
  }
  return order[index]
}

/** The day the first bucket actually starts on, which may precede `from`. */
function firstBucketStart(from: string, unit: BucketUnit): string {
  if (unit === 'month') return startOfMonth(from)
  if (unit === 'week') return startOfWeek(from)
  return from
}

function formatBucketLabel(day: string, unit: BucketUnit, crossesYear: boolean): string {
  const date = dayToUtc(day)
  const month = MONTH_NAMES[date.getUTCMonth()]
  const shortYear = String(date.getUTCFullYear()).slice(2)

  if (unit === 'month') return crossesYear ? `${month} ${shortYear}` : month
  const dayOfMonth = date.getUTCDate()
  return crossesYear ? `${dayOfMonth} ${month} ${shortYear}` : `${dayOfMonth} ${month}`
}

/**
 * Every bucket in the range, including empty ones — so gaps render as zero
 * bars rather than silently disappearing from the chart.
 */
export function buildBuckets(range: RevenueRange): RevenueBucket[] {
  const buckets: RevenueBucket[] = []
  const { bucket, crossesYear } = range

  let cursor =
    bucket === 'month' ? startOfMonth(range.from)
    : bucket === 'week' ? startOfWeek(range.from)
    : range.from

  while (cursor <= range.to) {
    buckets.push({
      key: bucketKeyForDubaiDay(cursor, bucket),
      date: cursor,
      label: formatBucketLabel(cursor, bucket, crossesYear),
    })
    cursor =
      bucket === 'month' ? addMonths(cursor, 1)
      : bucket === 'week' ? addDays(cursor, 7)
      : addDays(cursor, 1)
  }

  return buckets
}

// --- Preset resolution ----------------------------------------------------

/** @deprecated Kept so existing callers of `getRevenueTrend` keep working. */
export type PeriodType = 'daily' | 'weekly' | 'monthly'

const PERIOD_PRESETS: Record<PeriodType, string> = {
  daily: 'last7d',
  weekly: 'last8w',
  monthly: 'last12m',
}

export function presetForPeriod(period: PeriodType): string {
  return PERIOD_PRESETS[period] ?? DEFAULT_PRESET
}

interface PresetWindow {
  from: string
  to: string
  label: string
}

function windowForPreset(preset: string, today: string): PresetWindow | null {
  const yearMatch = /^year:(\d{4})$/.exec(preset)
  if (yearMatch) {
    const year = yearMatch[1]
    const currentYear = today.slice(0, 4)
    if (year > currentYear) return null
    return {
      from: `${year}-01-01`,
      // Don't project empty months into the future for the current year.
      to: year === currentYear ? today : `${year}-12-31`,
      label: year,
    }
  }

  switch (preset) {
    case 'last7d':
      return { from: addDays(today, -6), to: today, label: 'Last 7 days' }
    case 'last30d':
      return { from: addDays(today, -29), to: today, label: 'Last 30 days' }
    case 'last8w':
      return { from: addDays(startOfWeek(today), -49), to: today, label: 'Last 8 weeks' }
    case 'last12m':
      return { from: startOfMonth(addMonths(today, -11)), to: today, label: 'Last 12 months' }
    case 'ytd':
      return { from: `${today.slice(0, 4)}-01-01`, to: today, label: 'Year to date' }
    default:
      return null
  }
}

function describeRange(from: string, to: string): string {
  return `${formatBucketLabel(from, 'day', true)} – ${formatBucketLabel(to, 'day', true)}`
}

/**
 * Resolves URL params into a concrete range. Invalid or missing input always
 * degrades to the default preset rather than throwing — this is read-only
 * dashboard state driven by a user-editable query string.
 *
 * `today` is injectable so the logic stays testable without faking the clock.
 */
export function resolveRevenueRange(input: RevenueRangeInput, today: string): RevenueRange {
  const requestedBucket =
    input.bucket === 'day' || input.bucket === 'week' || input.bucket === 'month'
      ? input.bucket
      : undefined

  let from: string
  let to: string
  let preset: string
  let label: string

  // A wholly-future custom range has no bookings by definition, so fall back
  // rather than render an empty chart. Only reachable by editing the URL — the
  // calendar disables future dates.
  const customIsUsable =
    isValidDay(input.from) && isValidDay(input.to)
      ? (input.from! <= input.to! ? input.from! : input.to!) <= today
      : false

  if (customIsUsable) {
    // Tolerate a reversed range rather than rendering nothing.
    const [start, end] =
      input.from! <= input.to! ? [input.from!, input.to!] : [input.to!, input.from!]
    from = start
    // Revenue is booked, never scheduled — there is nothing after today.
    to = end > today ? today : end
    preset = 'custom'
    label = describeRange(from, to)
  } else {
    const resolved =
      windowForPreset(input.preset ?? DEFAULT_PRESET, today) ??
      windowForPreset(DEFAULT_PRESET, today)!
    from = resolved.from
    to = resolved.to
    preset = windowForPreset(input.preset ?? '', today) ? input.preset! : DEFAULT_PRESET
    label = resolved.label
  }

  if (daysBetween(from, to) + 1 > MAX_RANGE_DAYS) {
    from = addDays(to, -(MAX_RANGE_DAYS - 1))
    label = describeRange(from, to)
  }

  const desiredBucket = requestedBucket ?? autoBucket(from, to)
  const bucket = fitBucket(from, to, desiredBucket)

  // `month` is the coarsest unit, so a range wide enough to exceed MAX_BUCKETS
  // in months can't be fixed by coarsening — trim the window instead.
  if (bucketCount(from, to, bucket) > MAX_BUCKETS) {
    from = startOfMonth(addMonths(to, -(MAX_BUCKETS - 1)))
    label = describeRange(from, to)
  }

  // Week and month buckets can start before `from` (a range opening mid-week
  // or mid-month), so the year check has to use the real first bucket or the
  // label would drop a year it actually needs.
  const bucketStart = firstBucketStart(from, bucket)

  return {
    from,
    to,
    bucket,
    preset,
    label,
    crossesYear: bucketStart.slice(0, 4) !== to.slice(0, 4),
    bucketAdjusted: bucket !== desiredBucket,
  }
}

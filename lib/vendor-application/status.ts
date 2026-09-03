import { differenceInCalendarDays, format } from 'date-fns'
import { bookingToday } from '@/lib/utils/timezone'

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = ['pending', 'approved', 'rejected']

/**
 * One name per state. The page used to run three at once: a banner reading "Application Under
 * Review", a badge reading "Pending" built by capitalising the raw enum, and an account CTA
 * reading "Under Review". Mirrors STATUS_LABEL in components/account/booking-card.tsx.
 */
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: 'In review',
  approved: 'Approved',
  rejected: 'Not approved',
}

/** The review window quoted to the applicant when they submit. */
export const REVIEW_WINDOW_HOURS = 48

export function normalizeApplicationStatus(value: string | null | undefined): ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : 'pending'
}

/** Elapsed time, so no timezone conversion applies. See the timezone policy in CLAUDE.md. */
export function decisionDueAt(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + REVIEW_WINDOW_HOURS * 60 * 60 * 1000)
}

/**
 * Last four characters, everything ahead of them replaced by dots. The applicant needs to
 * recognise the account they gave us, not read it back.
 */
export function maskTail(value: string | null | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, '') ?? ''
  if (!trimmed) return null
  if (trimmed.length <= 4) return trimmed
  return `···· ${trimmed.slice(-4)}`
}

/**
 * A stored expiry is a calendar date (`yyyy-MM-dd`), not an instant. It is parsed local and
 * formatted local so it round-trips symmetrically; pinning it to the operating timezone would
 * introduce a day shift. "Today" still comes from bookingToday() so the comparison is made on
 * the platform's clock rather than the visitor's.
 */
export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatCalendarDate(value: string | null | undefined): string | null {
  const date = parseCalendarDate(value)
  return date ? format(date, 'dd MMM yyyy') : null
}

export type ExpiryState =
  | { kind: 'lapsed'; label: string }
  | { kind: 'due'; label: string }
  | { kind: 'clear' }

/** Warn inside 60 days, flag once lapsed, stay silent otherwise. */
export function expiryState(value: string | null | undefined): ExpiryState {
  const date = parseCalendarDate(value)
  if (!date) return { kind: 'clear' }

  const days = differenceInCalendarDays(date, new Date(`${bookingToday()}T00:00:00`))

  if (days < 0) return { kind: 'lapsed', label: 'Lapsed' }
  if (days === 0) return { kind: 'due', label: 'Expires today' }
  if (days === 1) return { kind: 'due', label: 'Expires tomorrow' }
  if (days <= 60) return { kind: 'due', label: `Expires in ${days} days` }
  return { kind: 'clear' }
}

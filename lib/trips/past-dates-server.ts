import 'server-only'
import { redirect } from 'next/navigation'
import { bookingToday } from '@/lib/utils/timezone'
import type { RawSearchParams } from './search-params'
import { rollPastDatesForward } from './past-dates'

/**
 * Search and checkout pages call this first. A URL carrying a past date is
 * redirected to the same page dated today, so the date shown, the vehicle links
 * and the checkout form all agree. See `rollPastDatesForward`.
 */
export function redirectIfPastDates(pathname: string, params: RawSearchParams): void {
  const next = rollPastDatesForward(params, bookingToday())
  if (next) redirect(`${pathname}?${next.toString()}`)
}

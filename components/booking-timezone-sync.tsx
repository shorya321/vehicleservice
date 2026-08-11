'use client'

import { setBookingTimezone } from '@/lib/utils/timezone'

/**
 * Carries the stored operating timezone into the browser.
 *
 * The date helpers keep the zone in a module-level value so that every one of
 * them can stay synchronous, which is what lets a client component, a PDF
 * generator and an email builder all call the same function. On the server that
 * value is set by `loadBookingTimezone()`. In the browser there is no database,
 * so the server has to hand the value over, and this is the handover.
 *
 * Applied during render rather than in an effect, deliberately: siblings format
 * dates during this same render pass, and an effect would run after they had
 * already produced the wrong string. The call is an idempotent module write,
 * not React state, so doing it in render is safe and causes no re-render.
 *
 * Renders nothing. Mount it before anything that displays a date.
 */
export function BookingTimezoneSync({ timeZone }: { timeZone: string }) {
  setBookingTimezone(timeZone)
  return null
}

/**
 * The business module's door onto the Dubai timezone primitives.
 * SCOPE: Business module ONLY.
 *
 * Business code imports from here, never from `@/lib/utils/timezone` directly.
 * `tests/business/timezone-chokepoint.test.ts` enforces it.
 *
 * Why a re-export rather than a copy. The standing rule is that the business
 * module keeps its own copies rather than sharing with the customer flow, and
 * for anything with product judgement in it - wording, price visibility, guest
 * breakdown - that is right, because the two sides are free to diverge.
 *
 * A timezone offset is the opposite kind of thing. There is exactly one correct
 * answer, it is the same for both flows, and two copies that drift would mean
 * the two halves of the product disagreeing about what day it is. That is the
 * bug class this module exists to prevent, so duplicating it here would be
 * building the thing we are removing.
 *
 * This is the same call already made for the email transport: see the note in
 * `lib/business/email/platform.ts`, which is allowed to reach into `lib/email/`
 * because two copies of the credential crypto that can drift is worse than the
 * coupling. Same reasoning, same shape - one named file crosses, nothing else.
 */

export {
  BOOKING_TIMEZONE,
  BOOKING_UTC_OFFSET,
  BOOKING_UTC_OFFSET_MINUTES,
  type DateInput,
  bookingDayKey,
  bookingDaysAgoUtc,
  bookingLocalInputToUtc,
  bookingRelativeTime,
  bookingToday,
  bookingUtcToLocalInput,
  bookingWallClockToUtc,
  formatBookingDate,
  formatBookingDateTime,
  formatBookingTime,
  startOfBookingDayUtc,
  startOfBookingMonthUtc,
  toBookingTz,
} from '@/lib/utils/timezone'

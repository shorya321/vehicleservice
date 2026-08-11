import 'server-only'

/**
 * The server-only half of the business module's timezone door.
 * SCOPE: Business module ONLY.
 *
 * Split from `./timezone` for the same reason `lib/business/email/brand.ts` is
 * split from `platform.ts`: the sibling is imported by client components, and
 * anything marked `server-only` reaching them breaks the browser bundle. Keep
 * the loader here and the isomorphic helpers there.
 */

export { loadBookingTimezone } from '@/lib/site-settings/timezone'

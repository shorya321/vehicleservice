import 'server-only'

import { getSiteSettings } from './server'
import { setBookingTimezone } from '@/lib/utils/timezone'

/**
 * Loads the stored operating timezone and applies it to the date helpers.
 *
 * Why this exists at all. Every date helper in `lib/utils/timezone.ts` is
 * synchronous, because it is called from client components, pure utilities, PDF
 * generators and email builders alike. The setting lives in the database and is
 * read asynchronously. Something has to bridge the two, and the bridge is a
 * module-level value that this function keeps current.
 *
 * Call it from a server component or route that renders early. It is cheap:
 * `getSiteSettings` is wrapped in `unstable_cache` with the `site-settings`
 * tag, so this is a cache read rather than a query, and the admin action
 * revalidates that tag on save.
 *
 * If it has not run yet - a route that never awaits it, a cold worker - the
 * helpers use `DEFAULT_BOOKING_TIMEZONE` rather than failing. That is the
 * correct fallback while Dubai is the configured value, and it is the reason
 * changing the setting takes effect on the next render rather than mid-render.
 */
export async function loadBookingTimezone(): Promise<string> {
  const settings = await getSiteSettings()
  setBookingTimezone(settings.timezone)
  return settings.timezone
}

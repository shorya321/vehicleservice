import 'server-only'

import { getSiteSettings } from '@/lib/site-settings/server'

/**
 * The business module's door onto the platform cancellation setting.
 * SCOPE: Business module ONLY.
 *
 * The module keeps its own copies of most things, deliberately. This is not one
 * of them, for the same reason the timezone is not: there is a single row of
 * `site_settings` and an admin who edits it expects one answer, so a second copy
 * that drifted would mean the portal and the admin panel disagreeing about
 * whether a booking is still cancellable.
 *
 * `server-only` and split from the isomorphic helpers for the same reason
 * `timezone-server.ts` is: `getSiteSettings` reaches the database, and dragging
 * it into a client component would break the browser bundle. The value is read
 * on the server and passed down as a prop.
 */
export async function loadCancellationWindowMinutes(): Promise<number> {
  const { business_cancellation_window_minutes } = await getSiteSettings()

  return business_cancellation_window_minutes
}

import type { Metadata } from 'next'

/**
 * For pages that only make sense mid-flow (checkout, payment, confirmation,
 * sign-in, search results with query parameters). Set on the segment layout so
 * every page beneath it inherits it; `follow: false` keeps crawlers from
 * walking per-booking links out of them.
 */
export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
}

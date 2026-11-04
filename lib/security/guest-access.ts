import 'server-only'
import { cookies, headers } from 'next/headers'
import {
  GUEST_ACCESS_TTL_MS,
  GUEST_COOKIE_NAME,
  addGuestEntry,
  guestEntriesInclude,
  readGuestCookie,
  writeGuestCookie,
} from '@/lib/security/guest-checkout'

/**
 * Cookie side of guest checkout. The browser that creates a guest booking gets a
 * signed, httpOnly entry for that reference, and only that browser can open its
 * payment page or confirm its payment. Confirmation and invoice stay public by
 * booking number, as they already were.
 */

/** Grants this browser access to a guest booking. Server Actions and Route Handlers only. */
export async function grantGuestAccess(reference: string): Promise<void> {
  const store = await cookies()
  const entries = addGuestEntry(readGuestCookie(store.get(GUEST_COOKIE_NAME)?.value), reference)
  store.set(GUEST_COOKIE_NAME, writeGuestCookie(entries), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(GUEST_ACCESS_TTL_MS / 1000),
  })
}

/** True when this browser created the guest booking `reference` within the access window. */
export async function hasGuestAccess(reference: string): Promise<boolean> {
  try {
    const store = await cookies()
    return guestEntriesInclude(readGuestCookie(store.get(GUEST_COOKIE_NAME)?.value), reference)
  } catch (error) {
    console.error('[guest-access] cookie read failed:', error instanceof Error ? error.message : error)
    return false
  }
}

/** Best-effort client address for rate limiting (first hop of x-forwarded-for). */
export async function clientAddress(): Promise<string> {
  const list = await headers()
  const forwarded = list.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || list.get('x-real-ip') || 'unknown'
}

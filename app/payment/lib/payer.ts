import 'server-only'
import type { User } from '@supabase/supabase-js'
import { hasGuestAccess } from '@/lib/security/guest-access'

/**
 * Who is on the payment page, and what they may pay for:
 *  - a signed-in customer, for their own bookings (`customer_id = user.id`), exactly as before;
 *  - the browser that created a guest booking (guest cookie), for that booking, even if
 *    the visitor has since signed in.
 */
export interface Payer {
  /** The signed-in account, if any. */
  userId: string | null
  /** The signed-in account's email ('' for an anonymous guest). */
  email: string
  /** This browser holds guest access to the reference being paid. */
  guestAccess: boolean
}

/** The payer for `reference`, or null when the visitor is anonymous and holds no guest access. */
export async function resolvePayer(reference: string, user: User | null): Promise<Payer | null> {
  const guestAccess = await hasGuestAccess(reference)
  if (!user && !guestAccess) return null
  return { userId: user?.id ?? null, email: user?.email || '', guestAccess }
}

/** True when the row is the payer's own account booking, or a guest booking this browser made. */
export function payerOwns(customerId: string | null, payer: Payer): boolean {
  if (customerId === null) return payer.guestAccess
  return payer.userId !== null && customerId === payer.userId
}

/** Where the Stripe receipt goes: the account email for an account booking, else the guest email. */
export function receiptEmail(customerId: string | null, payer: Payer, guestEmail: string | null): string {
  return customerId === null ? guestEmail ?? '' : payer.email
}

/** The account that holds a Stripe customer for this row; null for a guest booking. */
export function stripeCustomerAccount(customerId: string | null, payer: Payer): string | null {
  return customerId !== null && customerId === payer.userId ? customerId : null
}

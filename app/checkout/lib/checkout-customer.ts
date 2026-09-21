import 'server-only'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * The signed-in customer for a trip-type checkout page, redirecting everyone
 * else exactly as the one-way checkout page does: anonymous visitors to the
 * checkout login (returning here afterwards) and admin, vendor and business
 * accounts to their own dashboards.
 */
export async function loadCheckoutCustomer(returnPath: string): Promise<{ user: User; profile: Profile | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/checkout-login?returnUrl=${encodeURIComponent(returnPath)}`)
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile && profile.role !== 'customer') {
    if (profile.role === 'admin') redirect('/admin/dashboard?error=Admin users cannot make bookings')
    if (profile.role === 'vendor') redirect('/vendor/dashboard?error=Vendor users cannot make bookings')
    if (profile.role === 'business') redirect('/business/dashboard?error=Business users cannot make bookings')
  }

  // No metadata fallback here: `profiles` has no first/last name columns, and the booking
  // form already reads `user_metadata` and `full_name` for its defaults.
  return { user, profile }
}

/** Rebuilds the current URL for the login return path. */
export function currentCheckoutPath(pathname: string, sp: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') params.set(key, value)
  }
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

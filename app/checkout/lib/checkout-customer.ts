import 'server-only'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Who is checking out on a trip-type page, matching the one-way checkout page:
 * an anonymous visitor books as a guest (`user` and `profile` null), a customer
 * gets their profile, and admin, vendor and business accounts go to their own
 * dashboards.
 */
export async function loadCheckoutCustomer(): Promise<{ user: User | null; profile: Profile | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { user: null, profile: null }

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

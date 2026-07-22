import { createClient } from '@/lib/supabase/server'

/**
 * Resolves the `vendor_applications.id` for the signed-in user.
 *
 * There is no `vendors` table in this schema — the approved application row *is*
 * the vendor entity, so every vendor-scoped query keys off this id rather than
 * the auth user id.
 *
 * Each vendor module currently carries its own private copy of this lookup and
 * they have drifted: `app/vendor/bookings/actions.ts` omits the `approved` check
 * and reaches for the service-role client. This is the canonical version —
 * modelled on `app/vendor/drivers/actions.ts` — and new modules should import it.
 * The existing copies are intentionally left alone; consolidating them would mean
 * editing the live online-booking path.
 *
 * Throws rather than returning null: every caller treats "no approved vendor" as
 * a hard stop, and a thrown error cannot be accidentally ignored the way a null
 * can be.
 */
export async function getCurrentVendorId(): Promise<string> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: vendor, error } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (error || !vendor) {
    throw new Error('Vendor not found or not approved')
  }

  return vendor.id
}

/**
 * The vendor id plus the auth user id, for writes that also stamp `created_by`.
 * Saves a second `getUser()` round trip in the create path.
 */
export async function getCurrentVendorContext(): Promise<{
  vendorId: string
  userId: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: vendor, error } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single()

  if (error || !vendor) {
    throw new Error('Vendor not found or not approved')
  }

  return { vendorId: vendor.id, userId: user.id }
}

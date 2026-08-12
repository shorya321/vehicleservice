"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  getVehicleImageUrlsForUsers,
  removeVehicleImages,
} from "@/lib/vehicles/server-storage"
import { revalidatePath } from "next/cache"

/**
 * Clean up the business side of a user before deleting them.
 *
 * A business tenant can have several members (one owner plus staff), so what we
 * remove depends on which one this is:
 *   - staff  -> drop only their business_users row. The tenant, its wallet and
 *               its bookings belong to the business, not to them.
 *   - owner  -> deleting the owner tears down the whole business_accounts row
 *               and cascades every child record, so refuse while other members
 *               still exist rather than destroying their data by surprise.
 */
async function countRows(
  adminClient: SupabaseClient,
  table: string,
  column: string,
  value: string
): Promise<number> {
  const { count, error } = await adminClient
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)

  if (error) {
    console.error(`Failed to count ${table}:`, error)
    return 0
  }

  return count ?? 0
}

/**
 * Describe what a business tenant still holds, so a refusal can name it.
 * Returns an empty array for a tenant with nothing worth preserving.
 */
async function describeBusinessData(
  adminClient: SupabaseClient,
  accountId: string
): Promise<string[]> {
  const [bookings, quotations, walletTx] = await Promise.all([
    countRows(adminClient, 'business_bookings', 'business_account_id', accountId),
    countRows(adminClient, 'business_quotations', 'business_account_id', accountId),
    countRows(adminClient, 'wallet_transactions', 'business_account_id', accountId),
  ])

  return [
    bookings > 0 && `${bookings} booking(s)`,
    quotations > 0 && `${quotations} quotation(s)`,
    walletTx > 0 && `${walletTx} wallet transaction(s)`,
  ].filter(Boolean) as string[]
}

/**
 * Locate the business tenant a user belongs to.
 *
 * The membership row is the trusted link. It can go missing - a tenant created
 * without one, or a row already cascaded away - and when it does the account and
 * every booking under it were silently stranded by the delete. The email
 * fallback catches that case, but is marked `viaFallback` so it can only ever
 * produce a refusal, never the deletion of a tenant we are not certain about.
 */
async function findBusinessAccountForUser(
  adminClient: SupabaseClient,
  userId: string
): Promise<{ id: string | null; role: string; business_account_id: string; viaFallback: boolean } | null> {
  const { data: membership } = await adminClient
    .from('business_users')
    .select('id, role, business_account_id')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (membership?.business_account_id) {
    return { ...membership, viaFallback: false }
  }

  const { data: profile } = await adminClient
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.email) return null

  const { data: account } = await adminClient
    .from('business_accounts')
    .select('id')
    .eq('business_email', profile.email)
    .maybeSingle()

  if (!account) return null

  return { id: null, role: 'owner', business_account_id: account.id, viaFallback: true }
}

export async function cleanupBusinessData(
  adminClient: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const businessUser = await findBusinessAccountForUser(adminClient, userId)

  if (!businessUser?.business_account_id) return {}

  // Found only by email, so the membership link is broken. Never delete a tenant
  // on that evidence - refuse if it holds anything, otherwise leave it alone.
  if (businessUser.viaFallback) {
    const held = await describeBusinessData(adminClient, businessUser.business_account_id)
    if (held.length > 0) {
      return {
        error: `This user's business account still has ${held.join(', ')}. Delete the business from Businesses first, then delete this user.`,
      }
    }
    return {}
  }

  if (profile?.role !== 'business') return {}

  // Staff member: remove the membership only, leave the tenant intact.
  if (businessUser.role !== 'owner') {
    const { error } = await adminClient
      .from('business_users')
      .delete()
      .eq('id', businessUser.id)

    if (error) {
      console.error('Failed to remove business team member:', error)
      return { error: 'Failed to remove the user from their business account' }
    }

    return {}
  }

  // Owner: refuse if the business still has other members, otherwise deleting
  // one person silently wipes the whole business and everyone else's bookings.
  const { count, error: countError } = await adminClient
    .from('business_users')
    .select('id', { count: 'exact', head: true })
    .eq('business_account_id', businessUser.business_account_id)
    .neq('id', businessUser.id)

  if (countError) {
    console.error('Failed to count business team members:', countError)
    return { error: 'Failed to check the business account team members' }
  }

  if ((count ?? 0) > 0) {
    return {
      error: `This business has ${count} other team member(s). Remove them before deleting the owner.`,
    }
  }

  // Deleting the tenant cascades its bookings, quotations and wallet history.
  // Refuse while it still holds any of that - removing a person must never be a
  // silent way to destroy a business's records.
  const { data: account } = await adminClient
    .from('business_accounts')
    .select('business_name')
    .eq('id', businessUser.business_account_id)
    .maybeSingle()

  const held = await describeBusinessData(adminClient, businessUser.business_account_id)

  if (held.length > 0) {
    const name = account?.business_name ?? 'their business'
    return {
      error: `This user is the last member of "${name}", which still has ${held.join(', ')}. Delete the business account from Businesses first, then delete this user.`,
    }
  }

  // Empty tenant: safe to remove along with the user.
  const { error } = await adminClient
    .from('business_accounts')
    .delete()
    .eq('id', businessUser.business_account_id)

  if (error) {
    console.error('Failed to delete business account:', error)
    if (error.code === '23503') {
      return {
        error: 'This business has records created from a quotation. Remove them from their quotation before deleting.',
      }
    }
    return { error: `Failed to delete business account: ${error.message}` }
  }

  return {}
}

/**
 * Find records that will stop `auth.admin.deleteUser` from succeeding.
 *
 * Deleting a user removes only the auth.users row and leans on
 * auth.users -> profiles -> vendor_applications -> (vehicles | vendor_drivers)
 * cascading. Two foreign keys are declared without ON DELETE and therefore
 * abort the whole statement with SQLSTATE 23503 instead:
 *
 *   vendor_direct_bookings.created_by -> auth.users   (NO ACTION)
 *   site_settings.updated_by          -> auth.users   (NO ACTION)
 *
 * vendor_direct_bookings also pins the vendor's vehicles and drivers through
 * ON DELETE RESTRICT, so a vendor's own direct bookings block them twice over.
 * Report these up front rather than letting the admin see a bare failure.
 */
export async function findDeletionBlockers(
  adminClient: SupabaseClient,
  userId: string
): Promise<string[]> {
  const blockers: string[] = []

  // Direct bookings this user created (the constraint that actually fires).
  const { count: createdBookings, error: createdError } = await adminClient
    .from('vendor_direct_bookings')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId)

  if (createdError) {
    console.error('Failed to check vendor_direct_bookings.created_by:', createdError)
  } else if (createdBookings) {
    blockers.push(`${createdBookings} direct booking(s) they created`)
  }

  // Direct bookings belonging to this user's vendor account, which pin its
  // vehicles and drivers via RESTRICT.
  const { data: application, error: applicationError } = await adminClient
    .from('vendor_applications')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (applicationError) {
    console.error('Failed to look up vendor application:', applicationError)
  } else if (application) {
    const { count: vendorBookings, error: vendorError } = await adminClient
      .from('vendor_direct_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', application.id)

    if (vendorError) {
      console.error('Failed to check vendor_direct_bookings.vendor_id:', vendorError)
    } else if (vendorBookings) {
      blockers.push(`${vendorBookings} direct booking(s) on their vendor account`)
    }
  }

  // Site settings rows stamped with this user as the last editor.
  const { count: settingsRows, error: settingsError } = await adminClient
    .from('site_settings')
    .select('id', { count: 'exact', head: true })
    .eq('updated_by', userId)

  if (settingsError) {
    console.error('Failed to check site_settings.updated_by:', settingsError)
  } else if (settingsRows) {
    blockers.push(`${settingsRows} site settings record(s)`)
  }

  return blockers
}

export async function deleteUser(id: string) {
  const adminClient = createAdminClient()

  try {
    // Check if user is trying to delete themselves
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { error: 'Unauthorized' }
    }

    if (currentUser.id === id) {
      return { error: 'You cannot delete your own account' }
    }

    // This action deletes with the service-role key, so it must verify the
    // caller is an admin itself rather than relying on route middleware.
    const { data: callerProfile, error: callerError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (callerError || callerProfile?.role !== 'admin') {
      return { error: 'Only admins can delete users' }
    }

    // Check if this is the last admin. Use the admin client and surface query
    // failures - a failed lookup previously read as "no admins left".
    const { data: admins, error: adminsError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .neq('id', id)

    if (adminsError) {
      console.error('Failed to count remaining admins:', adminsError)
      return { error: 'Could not verify remaining admin users. Please try again.' }
    }

    if (!admins || admins.length === 0) {
      return { error: 'Cannot delete the last admin user' }
    }

    // Report what is pinning this user before destroying anything.
    const blockers = await findDeletionBlockers(adminClient, id)
    if (blockers.length > 0) {
      return {
        error: `This user cannot be deleted because they are still linked to: ${blockers.join(', ')}. Remove these records first, then try again.`,
      }
    }

    // If business user, delete their business account first (cascades all business data)
    const bizCleanup = await cleanupBusinessData(adminClient, id)
    if (bizCleanup.error) return { error: bizCleanup.error }

    // Collect the vehicle images before the delete: deleting the user cascades
    // auth.users -> profiles -> vendor_applications -> vehicles, destroying the
    // only record of the image URLs.
    const imageUrls = (await getVehicleImageUrlsForUsers([id])).get(id) ?? []

    // Delete from auth (cascade will delete profile)
    const { error } = await adminClient.auth.admin.deleteUser(id)

    if (error) {
      // Never swallow the cause - a bare "Failed to delete user" left admins
      // with no idea which records were blocking them.
      console.error('Failed to delete user:', { id, error })

      const code = (error as { code?: string }).code
      if (code === '23503' || /foreign key|still referenced|violates/i.test(error.message)) {
        return {
          error: 'This user still has linked records that must be removed before they can be deleted.',
        }
      }

      return { error: `Failed to delete user: ${error.message}` }
    }

    // Only after the user is gone, so a failed delete never destroys live images.
    await removeVehicleImages(imageUrls)

    revalidatePath('/admin/users')

    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
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
export async function cleanupBusinessData(
  adminClient: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profile?.role !== 'business') return {}

  const { data: businessUser } = await adminClient
    .from('business_users')
    .select('id, role, business_account_id')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (!businessUser?.business_account_id) return {}

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

  const { error } = await adminClient
    .from('business_accounts')
    .delete()
    .eq('id', businessUser.business_account_id)

  if (error) {
    console.error('Failed to delete business account:', error)
    return { error: 'Failed to delete business account and related data' }
  }

  return {}
}

export async function deleteUser(id: string) {
  const adminClient = createAdminClient()

  try {
    // Check if user is trying to delete themselves
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (currentUser?.id === id) {
      return { error: 'You cannot delete your own account' }
    }

    // Check if this is the last admin
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .neq('id', id)

    if (!admins || admins.length === 0) {
      return { error: 'Cannot delete the last admin user' }
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
      return { error: 'Failed to delete user' }
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
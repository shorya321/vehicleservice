"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

/**
 * If user is a business user, delete their business_account first.
 * This cascades all business child data (bookings, wallet, users, etc.).
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
    .select('business_account_id')
    .eq('auth_user_id', userId)
    .single()

  if (businessUser?.business_account_id) {
    const { error } = await adminClient
      .from('business_accounts')
      .delete()
      .eq('id', businessUser.business_account_id)

    if (error) {
      console.error('Failed to delete business account:', error)
      return { error: 'Failed to delete business account and related data' }
    }
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

    // Delete from auth (cascade will delete profile)
    const { error } = await adminClient.auth.admin.deleteUser(id)

    if (error) {
      return { error: 'Failed to delete user' }
    }

    revalidatePath('/admin/users')

    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
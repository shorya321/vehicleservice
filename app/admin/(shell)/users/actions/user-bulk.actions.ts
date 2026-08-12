"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getVehicleImageUrlsForUsers,
  removeVehicleImages,
} from "@/lib/vehicles/server-storage"
import { revalidatePath } from "next/cache"
import { logUserActivity } from "./user-activity.actions"
import { cleanupBusinessData, findDeletionBlockers } from "./user-delete.actions"

// Not exported: files with 'use server' may only export async functions.
interface BulkDeleteUsersResult {
  error?: string
  deletedCount?: number
  failed?: { id: string; reason: string }[]
}

export async function bulkDeleteUsers(
  userIds: string[]
): Promise<BulkDeleteUsersResult> {
  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  try {
    // Check if user is admin
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser?.user) {
      return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Only admins can delete users' }
    }

    const deletableIds = userIds.filter((userId) => userId !== currentUser.user.id)

    // Collect the vehicle images before any delete: deleting a user cascades
    // auth.users -> profiles -> vendor_applications -> vehicles, destroying the
    // only record of the image URLs.
    const imageUrlsByUser = await getVehicleImageUrlsForUsers(deletableIds)
    const deletedIds: string[] = []
    const failed: { id: string; reason: string }[] = []

    // Delete users from auth (this will cascade to profiles)
    for (const userId of deletableIds) {
      // Report what is pinning this user instead of attempting a delete that
      // the database will reject with an opaque foreign key error.
      const blockers = await findDeletionBlockers(supabaseAdmin, userId)
      if (blockers.length > 0) {
        failed.push({ id: userId, reason: `Still linked to: ${blockers.join(', ')}` })
        continue
      }

      // Clean up business data before auth deletion. Its refusal (for example an
      // owner whose business still has other members) must stop this delete.
      const bizCleanup = await cleanupBusinessData(supabaseAdmin, userId)
      if (bizCleanup.error) {
        failed.push({ id: userId, reason: bizCleanup.error })
        continue
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) {
        console.error(`Failed to delete user ${userId}:`, error)
        failed.push({ id: userId, reason: error.message })
        continue
      }

      deletedIds.push(userId)
    }

    // Only for users actually deleted, so a failed delete leaves its images intact.
    await removeVehicleImages(deletedIds.flatMap((userId) => imageUrlsByUser.get(userId) ?? []))

    revalidatePath('/admin/users')

    if (deletedIds.length === 0) {
      return { error: failed[0]?.reason ?? 'No users were deleted' }
    }

    return { deletedCount: deletedIds.length, failed }
  } catch (error) {
    console.error('Bulk delete error:', error)
    return { error: 'Failed to delete users' }
  }
}

export async function exportUsersToCSV(
  userIds?: string[]
): Promise<{ data?: string; error?: string }> {
  const supabase = await createClient()
  
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser?.user) {
      return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Only admins can export user data' }
    }

    // Fetch users
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (userIds && userIds.length > 0) {
      query = query.in('id', userIds)
    }

    const { data: users, error } = await query

    if (error) throw error
    if (!users || users.length === 0) {
      return { error: 'No users found to export' }
    }

    // Create CSV
    const headers = [
      'ID',
      'Email',
      'Full Name',
      'Role',
      'Status',
      'Phone',
      'Email Verified',
      '2FA Enabled',
      'Last Sign In',
      'Sign In Count',
      'Created At'
    ]

    const rows = users.map(user => [
      user.id,
      user.email,
      user.full_name || '',
      user.role,
      user.status,
      user.phone || '',
      user.email_verified ? 'Yes' : 'No',
      user.two_factor_enabled ? 'Yes' : 'No',
      user.last_sign_in_at || 'Never',
      user.sign_in_count.toString(),
      user.created_at
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Log activity
    await logUserActivity(
      currentUser.user.id, 
      'users_exported', 
      { count: users.length, exported_ids: userIds }
    )

    return { data: csvContent }
  } catch (error) {
    console.error('Export error:', error)
    return { error: 'Failed to export users' }
  }
}
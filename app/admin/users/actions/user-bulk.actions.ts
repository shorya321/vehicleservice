"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { logUserActivity } from "./user-activity.actions"

export async function bulkDeleteUsers(
  userIds: string[]
): Promise<{ error?: string }> {
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

    // Delete users from auth (this will cascade to profiles)
    for (const userId of userIds) {
      if (userId !== currentUser.user.id) { // Prevent self-deletion
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) {
          console.error(`Failed to delete user ${userId}:`, error)
        }
      }
    }

    revalidatePath('/admin/users')
    return {}
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
"use server"

import { createClient } from "@/lib/supabase/server"
import { UserUpdate } from "@/lib/types/user"
import { revalidatePath } from "next/cache"
import { logUserActivity } from "./user-activity.actions"

export async function updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      } as UserUpdate)
      .eq('id', id)

    if (error) {
      return { error: 'Failed to update user status' }
    }

    revalidatePath('/admin/users')
    
    return { success: true }
  } catch (error) {
    console.error('Update user status error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function bulkUpdateUserStatus(
  userIds: string[], 
  status: 'active' | 'inactive' | 'suspended'
): Promise<{ error?: string }> {
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
      return { error: 'Only admins can update user status' }
    }

    // Update multiple users
    const { error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', userIds)
      .neq('id', currentUser.user.id) // Prevent self-update

    if (error) throw error

    // Log activity for each user
    for (const userId of userIds) {
      await logUserActivity(
        userId, 
        'status_changed_bulk', 
        { new_status: status, changed_by: currentUser.user.id }
      )
    }

    revalidatePath('/admin/users')
    return {}
  } catch (error) {
    console.error('Bulk update error:', error)
    return { error: 'Failed to update users' }
  }
}
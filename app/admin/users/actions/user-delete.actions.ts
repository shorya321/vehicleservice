"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

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
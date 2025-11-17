"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logUserActivity } from "./user-activity.actions"

export async function uploadUserPhoto(
  userId: string, 
  formData: FormData
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
      return { error: 'Only admins can upload user photos' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { error: 'No file provided' }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Failed to upload file' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      // Try to delete uploaded file
      await supabase.storage
        .from('user-uploads')
        .remove([filePath])
      
      return { error: 'Failed to update profile' }
    }

    // Log activity
    await logUserActivity(
      userId, 
      'avatar_uploaded', 
      { uploaded_by: currentUser.user.id, file_path: filePath }
    )

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    
    return {}
  } catch (error) {
    console.error('Upload photo error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteUserPhoto(userId: string): Promise<{ error?: string }> {
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
      return { error: 'Only admins can delete user photos' }
    }

    // Get current avatar URL
    const { data: user } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (!user?.avatar_url) {
      return { error: 'No photo to delete' }
    }

    // Extract file path from URL
    const url = new URL(user.avatar_url)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf('user-uploads')
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      const filePath = pathParts.slice(bucketIndex + 1).join('/')
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('user-uploads')
        .remove([filePath])

      if (deleteError) {
        console.error('Delete error:', deleteError)
      }
    }

    // Update profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      return { error: 'Failed to update profile' }
    }

    // Log activity
    await logUserActivity(
      userId, 
      'avatar_deleted', 
      { deleted_by: currentUser.user.id }
    )

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)
    
    return {}
  } catch (error) {
    console.error('Delete photo error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
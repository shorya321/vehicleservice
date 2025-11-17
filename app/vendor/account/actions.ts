"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import * as z from "zod"

interface NotificationPreferences {
  email_booking_updates: boolean
  email_payment_alerts: boolean
  email_security_alerts: boolean
  email_system_updates: boolean
}

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
})

export async function updateProfile(
  userId: string,
  values: z.infer<typeof profileSchema>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // Verify the user is updating their own profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return { error: "Unauthorized" }
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: values.full_name,
        phone: values.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Profile update error:', error)
      return { error: "Failed to update profile" }
    }

    revalidatePath('/vendor/account')
    return {}
  } catch (error) {
    console.error('Update profile error:', error)
    return { error: "An unexpected error occurred" }
  }
}

export async function uploadAvatar(
  userId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // Verify the user is updating their own profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return { error: "Unauthorized" }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { error: 'No file provided' }
    }

    // Delete old avatar if exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (profile?.avatar_url) {
      // Extract file path from URL
      const url = new URL(profile.avatar_url)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.indexOf('user-uploads')
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/')
        await supabase.storage
          .from('user-uploads')
          .remove([filePath])
      }
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

    revalidatePath('/vendor/account')
    return {}
  } catch (error) {
    console.error('Upload avatar error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // First verify the current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Unauthorized" }
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Password update error:', error)
      // Check if it's because current password is wrong
      if (error.message.includes('incorrect')) {
        return { error: "Current password is incorrect" }
      }
      return { error: "Failed to update password" }
    }

    return {}
  } catch (error) {
    console.error('Update password error:', error)
    return { error: "An unexpected error occurred" }
  }
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  
  try {
    // Get or create notification preferences
    const { data, error } = await supabase
      .rpc('get_or_create_notification_preferences', { p_user_id: userId })
    
    if (error) {
      console.error('Get notification preferences error:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return null
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  
  try {
    // Verify the user is updating their own preferences
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return { error: "Unauthorized" }
    }

    // First, ensure preferences exist by calling get_or_create
    await supabase.rpc('get_or_create_notification_preferences', { p_user_id: userId })

    // Update preferences
    const { error } = await supabase
      .from('notification_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Update notification preferences error:', error)
      return { error: "Failed to update notification preferences" }
    }

    return {}
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return { error: "An unexpected error occurred" }
  }
}
"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { PersonalInfoFormData, NotificationPreferencesFormData } from "./schemas"

// ============================================================================
// Profile Actions
// ============================================================================

export async function updateProfile(
  userId: string,
  data: PersonalInfoFormData
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      phone: data.phone || null,
      date_of_birth: data.date_of_birth || null,
      address_street: data.address_street || null,
      address_city: data.address_city || null,
      address_country: data.address_country || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Profile update error:", error)
    return { error: "Failed to update profile" }
  }

  revalidatePath("/account")
  return {}
}

export async function uploadAvatar(
  userId: string,
  formData: FormData
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return { error: "Unauthorized" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "No file provided" }
  }

  // Delete old avatar
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single()

  if (profile?.avatar_url) {
    const url = new URL(profile.avatar_url)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.indexOf("user-uploads")
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      const filePath = pathParts.slice(bucketIndex + 1).join("/")
      await supabase.storage.from("user-uploads").remove([filePath])
    }
  }

  // Upload new avatar
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("user-uploads")
    .upload(filePath, file, { cacheControl: "3600", upsert: false })

  if (uploadError) {
    console.error("Upload error:", uploadError)
    return { error: "Failed to upload file" }
  }

  const { data: { publicUrl } } = supabase.storage
    .from("user-uploads")
    .getPublicUrl(filePath)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (updateError) {
    await supabase.storage.from("user-uploads").remove([filePath])
    return { error: "Failed to update profile" }
  }

  revalidatePath("/account")
  return { url: publicUrl }
}

// ============================================================================
// Security Actions
// ============================================================================

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    console.error("Password update error:", error)
    if (error.message.includes("incorrect")) {
      return { error: "Current password is incorrect" }
    }
    return { error: "Failed to update password" }
  }

  return {}
}

export async function requestAccountDeletion(
  userId: string,
  reason: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return { error: "Unauthorized" }
  }

  // Check for existing pending request
  const { data: existing } = await supabase
    .from("account_deletion_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .single()

  if (existing) {
    return { error: "You already have a pending deletion request" }
  }

  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({ user_id: userId, reason })

  if (error) {
    console.error("Deletion request error:", error)
    return { error: "Failed to submit deletion request" }
  }

  return {}
}

export async function cancelDeletionRequest(
  requestId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("account_deletion_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending")

  if (error) {
    console.error("Cancel deletion request error:", error)
    return { error: "Failed to cancel deletion request" }
  }

  revalidatePath("/account")
  return {}
}

// ============================================================================
// Notification Preferences Actions
// ============================================================================

export async function getNotificationPreferences(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc("get_or_create_notification_preferences", { p_user_id: userId })
  return data
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferencesFormData>
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return { error: "Unauthorized" }
  }

  await supabase.rpc("get_or_create_notification_preferences", { p_user_id: userId })

  const { error } = await supabase
    .from("notification_preferences")
    .update({ ...prefs, updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  if (error) {
    console.error("Update notification preferences error:", error)
    return { error: "Failed to update preferences" }
  }

  return {}
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

function extractStoragePath(avatarUrl: string): string | null {
  try {
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.indexOf("user-uploads")
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join("/")
    }
    return null
  } catch {
    return null
  }
}

async function verifyBusinessUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (!businessUser) return null
  return user
}

export async function uploadBusinessAvatar(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    const user = await verifyBusinessUser(supabase)
    if (!user) {
      return { error: "Unauthorized" }
    }

    const file = formData.get("file") as File
    if (!file) {
      return { error: "No file provided" }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: "File size must not exceed 5MB" }
    }

    const fileExt = ALLOWED_TYPES[file.type]
    if (!fileExt) {
      return { error: "Only JPEG, PNG, and WebP images are allowed" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    const oldAvatarPath = profile?.avatar_url
      ? extractStoragePath(profile.avatar_url)
      : null

    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await adminClient.storage
      .from("user-uploads")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      return { error: "Failed to upload file" }
    }

    const { data: { publicUrl } } = adminClient.storage
      .from("user-uploads")
      .getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      await adminClient.storage.from("user-uploads").remove([filePath])
      return { error: "Failed to update profile" }
    }

    if (oldAvatarPath) {
      await adminClient.storage.from("user-uploads").remove([oldAvatarPath])
    }

    revalidatePath("/business/settings")
    revalidatePath("/business")
    return {}
  } catch {
    return { error: "An unexpected error occurred" }
  }
}

export async function deleteBusinessAvatar(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  try {
    const user = await verifyBusinessUser(supabase)
    if (!user) {
      return { error: "Unauthorized" }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    if (!profile?.avatar_url) {
      return { error: "No avatar to remove" }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      return { error: "Failed to update profile" }
    }

    const storagePath = extractStoragePath(profile.avatar_url)
    if (storagePath) {
      await adminClient.storage.from("user-uploads").remove([storagePath])
    }

    revalidatePath("/business/settings")
    revalidatePath("/business")
    return {}
  } catch {
    return { error: "An unexpected error occurred" }
  }
}

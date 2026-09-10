"use server"

import { randomUUID } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"

/** Every admin-managed content image lives in this bucket under a folder prefix. */
const BUCKET = 'vehicles'

/**
 * Writes a route photo and returns its public URL.
 *
 * The service-role client is used rather than the caller's, matching the other
 * admin uploaders: the storage policies on `vehicles` grant admins write access
 * anywhere in the bucket, and going through the admin client keeps the write off
 * the browser's auth session entirely.
 */
export async function uploadRouteImage(
  routeSlug: string,
  imageBase64: string
): Promise<{ imageUrl: string | null; error: string | null }> {
  const adminSupabase = createAdminClient()

  try {
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return { imageUrl: null, error: 'Invalid image format' }
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const fileExt = mimeType.split('/')[1] || 'jpg'

    const buffer = Buffer.from(base64Data, 'base64')

    // Unique key per upload: a stable path would keep the public URL identical
    // across re-uploads, so the next/image optimizer and the Supabase CDN would
    // both keep serving the previous image. The caller deletes the old object.
    const fileName = `routes/${routeSlug}/${randomUUID()}.${fileExt}`

    const { error } = await adminSupabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: '31536000, immutable',
      })

    if (error) {
      console.error('[Routes] Error uploading route image:', error)
      return { imageUrl: null, error: 'Failed to upload route image' }
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage.from(BUCKET).getPublicUrl(fileName)

    return { imageUrl: publicUrl, error: null }
  } catch (error) {
    console.error('[Routes] Unexpected error during image upload:', error)
    return { imageUrl: null, error: 'An unexpected error occurred during image upload' }
  }
}

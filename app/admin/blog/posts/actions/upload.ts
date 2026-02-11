"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function uploadBlogImage(
  slug: string,
  imageBase64: string
) {
  const adminSupabase = createAdminClient()

  try {
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return { error: 'Invalid image format', imageUrl: null }
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const fileExt = mimeType.split('/')[1] || 'jpg'

    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `blog/${slug}/featured.${fileExt}`

    const { error } = await adminSupabase.storage
      .from('vehicles')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      console.error('[Blog] Error uploading image:', error)
      return { error: 'Failed to upload blog image', imageUrl: null }
    }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('vehicles')
      .getPublicUrl(fileName)

    return { imageUrl: publicUrl, error: null }
  } catch (error) {
    console.error('[Blog] Unexpected error during image upload:', error)
    return { error: 'An unexpected error occurred during image upload', imageUrl: null }
  }
}

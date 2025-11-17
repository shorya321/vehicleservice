"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function uploadCategoryImage(
  categorySlug: string,
  imageBase64: string
) {
  const adminSupabase = createAdminClient()

  try {
    // Extract the actual base64 data and mime type
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return { error: 'Invalid image format' }
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const fileExt = mimeType.split('/')[1] || 'jpg'
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `categories/${categorySlug}/category-image.${fileExt}`
    
    // Delete old image if exists (upsert will overwrite)
    const { data, error } = await adminSupabase.storage
      .from('vehicles')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      })

    if (error) {
      console.error('Error uploading category image:', error)
      return { error: 'Failed to upload category image' }
    }

    const { data: { publicUrl } } = adminSupabase.storage
      .from('vehicles')
      .getPublicUrl(fileName)
    
    return { 
      imageUrl: publicUrl,
      error: null 
    }
  } catch (error) {
    console.error('Unexpected error during image upload:', error)
    return { 
      error: 'An unexpected error occurred during image upload',
      imageUrl: null
    }
  }
}
"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function uploadVehicleImages(
  businessId: string,
  primaryImageBase64?: string | null,
  galleryImagesBase64?: string[]
) {
  const adminSupabase = createAdminClient()
  let primaryImageUrl = null
  let galleryImageUrls: string[] = []

  try {
    // Upload primary image if provided
    if (primaryImageBase64) {
      // Extract the actual base64 data and mime type
      const matches = primaryImageBase64.match(/^data:(.+);base64,(.+)$/)
      if (matches) {
        const mimeType = matches[1]
        const base64Data = matches[2]
        const fileExt = mimeType.split('/')[1] || 'jpg'
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `${businessId}/${Date.now()}-primary.${fileExt}`
        
        const { data, error } = await adminSupabase.storage
          .from('vehicles')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
          })

        if (error) {
          console.error('Error uploading primary image:', error)
          return { error: 'Failed to upload primary image' }
        }

        const { data: { publicUrl } } = adminSupabase.storage
          .from('vehicles')
          .getPublicUrl(fileName)
        
        primaryImageUrl = publicUrl
      }
    }

    // Upload gallery images if provided
    if (galleryImagesBase64 && galleryImagesBase64.length > 0) {
      const uploadPromises = galleryImagesBase64.map(async (imageBase64, index) => {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
        if (!matches) return null
        
        const mimeType = matches[1]
        const base64Data = matches[2]
        const fileExt = mimeType.split('/')[1] || 'jpg'
        
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `${businessId}/${Date.now()}-${index}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data, error } = await adminSupabase.storage
          .from('vehicles')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
          })

        if (error) {
          console.error('Error uploading gallery image:', error)
          return null
        }

        const { data: { publicUrl } } = adminSupabase.storage
          .from('vehicles')
          .getPublicUrl(fileName)
        
        return publicUrl
      })

      const results = await Promise.all(uploadPromises)
      galleryImageUrls = results.filter(url => url !== null) as string[]
    }

    return { 
      primaryImageUrl,
      galleryImageUrls,
      error: null 
    }
  } catch (error) {
    console.error('Unexpected error during image upload:', error)
    return { 
      error: 'An unexpected error occurred during image upload',
      primaryImageUrl: null,
      galleryImageUrls: []
    }
  }
}
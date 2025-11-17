import { createClient } from '@/lib/supabase/client'
import { validatePhotoFile } from './validation'

const STORAGE_BUCKET = 'user-uploads'
const REVIEWS_FOLDER = 'reviews'

// Upload a review photo to Supabase Storage
export async function uploadReviewPhoto(
  file: File,
  reviewId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Validate file
    const validation = validatePhotoFile(file)
    if (!validation.valid) {
      return { url: null, error: validation.error || 'Invalid file' }
    }

    const supabase = createClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${reviewId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${REVIEWS_FOLDER}/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: null, error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Upload exception:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

// Upload multiple photos
export async function uploadMultipleReviewPhotos(
  files: File[],
  reviewId: string
): Promise<{
  urls: string[]
  errors: string[]
}> {
  const results = await Promise.allSettled(
    files.map((file) => uploadReviewPhoto(file, reviewId))
  )

  const urls: string[] = []
  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.url) {
        urls.push(result.value.url)
      } else if (result.value.error) {
        errors.push(`File ${index + 1}: ${result.value.error}`)
      }
    } else {
      errors.push(`File ${index + 1}: Upload failed`)
    }
  })

  return { urls, errors }
}

// Delete a review photo from Supabase Storage
export async function deleteReviewPhoto(url: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient()

    // Extract path from URL
    const urlParts = url.split(`/${STORAGE_BUCKET}/`)
    if (urlParts.length < 2) {
      return { error: 'Invalid URL format' }
    }

    const filePath = urlParts[1]

    // Delete from storage
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Delete exception:', error)
    return {
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

// Delete multiple photos
export async function deleteMultipleReviewPhotos(urls: string[]): Promise<{
  errors: string[]
}> {
  const results = await Promise.allSettled(urls.map((url) => deleteReviewPhoto(url)))

  const errors: string[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.error) {
        errors.push(`Photo ${index + 1}: ${result.value.error}`)
      }
    } else {
      errors.push(`Photo ${index + 1}: Delete failed`)
    }
  })

  return { errors }
}

// Optimize photo before upload (client-side compression)
export async function optimizePhoto(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(file) // Return original if canvas not supported
          return
        }

        // Max dimensions
        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1920

        let width = img.width
        let height = img.height

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(optimizedFile)
            } else {
              resolve(file) // Return original if optimization failed
            }
          },
          'image/jpeg',
          0.85 // Quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))

      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.readAsDataURL(file)
  })
}

// Batch upload with optimization
export async function uploadOptimizedReviewPhotos(
  files: File[],
  reviewId: string,
  onProgress?: (current: number, total: number) => void
): Promise<{
  urls: string[]
  errors: string[]
}> {
  const urls: string[] = []
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i + 1, files.length)

      // Optimize photo
      const optimized = await optimizePhoto(files[i])

      // Upload
      const result = await uploadReviewPhoto(optimized, reviewId)

      if (result.url) {
        urls.push(result.url)
      } else if (result.error) {
        errors.push(`File ${i + 1}: ${result.error}`)
      }
    } catch (error) {
      errors.push(
        `File ${i + 1}: ${error instanceof Error ? error.message : 'Failed to process'}`
      )
    }
  }

  return { urls, errors }
}

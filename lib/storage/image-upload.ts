import { createClient } from '@/lib/supabase/client'
import { storagePathFromUrl } from './paths'

export interface UploadResult {
  url: string | null
  error: string | null
}

export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export interface UploadImageOptions {
  bucket: string
  path: string
}

/**
 * Nothing in this module is cancellable — neither `canvas.toBlob` nor the
 * Supabase storage client accepts an `AbortSignal`. These bounds exist so a
 * stalled step surfaces an error instead of leaving the caller's spinner
 * running forever; the underlying request may still be in flight.
 */
const OPTIMIZE_TIMEOUT_MS = 15_000
const UPLOAD_TIMEOUT_MS = 60_000
const DELETE_TIMEOUT_MS = 10_000

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

/** Rejects with `message` if `promise` has not settled within `ms`. */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  message: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

/** Resolves with `fallback` if `promise` has not settled within `ms`. */
async function withTimeoutFallback<T>(
  promise: PromiseLike<T>,
  ms: number,
  fallback: T
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Downscales and re-encodes an image on the client before upload.
 *
 * Always emits image/jpeg, which every bucket in this project whitelists.
 * Falls back to the original file if the canvas is unavailable, if encoding
 * fails, or if encoding stalls, so a browser quirk degrades quality rather
 * than blocking the upload. The stall case is real: `canvas.toBlob` is not
 * guaranteed to invoke its callback once the canvas exceeds the platform's
 * maximum area (iOS Safari gives up around 16.7 MP), which a large phone
 * photo hits, and without the bound the returned promise never settles.
 */
export async function optimizeImage(
  file: File,
  { maxWidth = 1920, maxHeight = 1920, quality = 0.85 }: OptimizeImageOptions = {}
): Promise<File> {
  const encoded = new Promise<File>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(file)
          return
        }

        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = event.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

  return withTimeoutFallback(encoded, OPTIMIZE_TIMEOUT_MS, file)
}

/** Uploads a file straight from the browser to Supabase Storage. */
export async function uploadImage(
  file: File,
  { bucket, path }: UploadImageOptions
): Promise<UploadResult> {
  try {
    const supabase = createClient()

    const { data, error } = await withTimeout(
      supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      }),
      UPLOAD_TIMEOUT_MS,
      'Upload timed out. Check your connection and try again.'
    )

    if (error) {
      return { url: null, error: error.message }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (error: unknown) {
    return { url: null, error: getErrorMessage(error, 'Upload failed') }
  }
}

/** Deletes an object addressed by its public URL. */
export async function deleteImageByUrl(
  url: string,
  bucket: string
): Promise<{ error: string | null }> {
  try {
    const path = storagePathFromUrl(url, bucket)

    if (!path) {
      return { error: 'Invalid storage URL' }
    }

    const supabase = createClient()
    const { error } = await withTimeout(
      supabase.storage.from(bucket).remove([path]),
      DELETE_TIMEOUT_MS,
      'Delete timed out'
    )

    return { error: error ? error.message : null }
  } catch (error: unknown) {
    return { error: getErrorMessage(error, 'Delete failed') }
  }
}

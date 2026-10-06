import { optimizeImage, uploadImage, withTimeout } from '@/lib/storage/image-upload'
import { signCmsImageUpload } from '@/app/admin/(shell)/content/pages/actions'
import { CMS_IMAGE_BUCKET } from './images'

/**
 * Bounded because a Server Action POST answered with a proxy redirect leaves
 * the client promise pending forever.
 */
const SIGN_TIMEOUT_MS = 15_000
const SIGN_FAILED = 'Could not start the upload. Refresh the page and try again.'

/**
 * Optimises an image in the browser and uploads it to a server-signed path.
 * Resolves to the public URL; throws with a readable message, which is what
 * `ImageUpload` shows in its toast.
 */
export async function uploadCmsImage(file: File): Promise<string> {
  const optimized = await optimizeImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.85 })
  const { path, token, error } = await withTimeout(
    signCmsImageUpload(optimized.type),
    SIGN_TIMEOUT_MS,
    SIGN_FAILED
  )

  if (error || !path || !token) {
    throw new Error(error ?? SIGN_FAILED)
  }

  const result = await uploadImage(optimized, { bucket: CMS_IMAGE_BUCKET, path, token })
  if (!result.url) {
    throw new Error(result.error ?? 'Upload failed')
  }
  return result.url
}

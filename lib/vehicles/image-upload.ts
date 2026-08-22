import {
  deleteImageByUrl,
  optimizeImage,
  uploadImage,
  withTimeout,
  type UploadResult,
} from '@/lib/storage/image-upload'
import { VEHICLE_BUCKET } from './bucket'
import { signVehicleImageUpload } from './sign-upload'

export { VEHICLE_BUCKET }

/**
 * Bounded because a Server Action POST answered with a proxy redirect leaves
 * the client promise pending forever. See the header comment in `proxy.ts`.
 */
const SIGN_TIMEOUT_MS = 15_000

const SIGN_FAILED = 'Could not start the upload. Refresh the page and try again.'

interface UploadVehicleImageArgs {
  businessId: string
  file: File
}

/**
 * Optimizes and uploads a vehicle's primary image from the browser.
 *
 * The server signs the upload and picks the path, then the browser writes to
 * it with the returned token. Nothing in this path calls `supabase.auth` in
 * the browser, which is deliberate: that is the call that waits on the GoTrue
 * Web Lock with no timeout, and a lock held elsewhere in the app used to stall
 * the upload for its whole 60 second budget without sending a request.
 *
 * Retried at most once, and only when the first attempt reported a transport
 * failure. The retry signs again rather than reusing the token: a signed URL
 * is single use, and the fresh uuid also avoids a 409 in the case where the
 * first attempt reached the server before the browser gave up on it. The cost
 * is at most one unreferenced object, the same harmless leftover a failed save
 * already produces and which `rollbackVehicleImage` exists for.
 */
export async function uploadVehicleImage({
  businessId,
  file,
}: UploadVehicleImageArgs): Promise<UploadResult> {
  try {
    const optimized = await optimizeImage(file)
    const first = await signAndUpload(businessId, optimized)

    if (!first.retryable) {
      return first
    }

    return await signAndUpload(businessId, optimized)
  } catch (error: unknown) {
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to process image',
      retryable: false,
    }
  }
}

async function signAndUpload(businessId: string, file: File): Promise<UploadResult> {
  const { path, token, error } = await withTimeout(
    signVehicleImageUpload(businessId, file.type),
    SIGN_TIMEOUT_MS,
    SIGN_FAILED
  )

  if (error || !path || !token) {
    return { url: null, error: error ?? SIGN_FAILED, retryable: false }
  }

  return uploadImage(file, { bucket: VEHICLE_BUCKET, path, token })
}

/** Best-effort rollback of an upload whose vehicle row failed to save. */
export async function deleteVehicleImage(url: string): Promise<{ error: string | null }> {
  return deleteImageByUrl(url, VEHICLE_BUCKET)
}

/**
 * Fire-and-forget variant for form error paths.
 *
 * The vehicle row was not written, so the orphaned object is cosmetic, never
 * make the vendor wait on the cleanup, and never let it reject into a handler
 * that has already reported the real failure.
 */
export function rollbackVehicleImage(url: string | null): void {
  if (!url) {
    return
  }

  void deleteVehicleImage(url).catch(() => {})
}

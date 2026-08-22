import { createClient } from '@/lib/supabase/client'
import { createUploadClient } from '@/lib/supabase/upload-client'
import { storagePathFromUrl } from './paths'

export { optimizeImage, type OptimizeImageOptions } from './optimize-image'

export interface UploadResult {
  url: string | null
  error: string | null
  /** True when sending the same bytes again, on a fresh path, could succeed. */
  retryable: boolean
}

export interface UploadImageOptions {
  bucket: string
  /** Path chosen by the server when it signed this upload. */
  path: string
  /** Token from `createSignedUploadUrl`. This is what authorizes the write. */
  token: string
}

/**
 * The upload is cancelled with an `AbortSignal` injected through the client's
 * `global.fetch`, because storage-js declares `signal` on `FileOptions` and
 * never reads it. `withTimeout` stays as a backstop for the case where the
 * signal is somehow ignored.
 */
const UPLOAD_TIMEOUT_MS = 60_000
const DELETE_TIMEOUT_MS = 10_000

const TIMEOUT_MESSAGE = 'Upload timed out. Check your connection and try again.'

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

function hasHttpStatus(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  )
}

function hasOriginalError(error: unknown): error is { originalError: unknown } {
  return typeof error === 'object' && error !== null && 'originalError' in error
}

/**
 * A second attempt is only worth the caller's time when the first failed for a
 * reason that is not about this request's content. A 4xx is a verdict: 403 is
 * the storage policy saying no, 409 is the path already taken, 413 and 415 are
 * the file itself being wrong. Resending the same bytes changes none of them.
 * A 5xx, or a fetch-level `TypeError`, is the transport, which can differ.
 *
 * The timeout is deliberately excluded. The caller has already waited a full
 * minute, and doubling that is a worse answer than an error they can act on.
 */
function isRetryable(error: unknown): boolean {
  if (hasHttpStatus(error)) {
    return error.status >= 500
  }

  return hasOriginalError(error) && error.originalError instanceof TypeError
}

/**
 * Uploads a file straight from the browser to Supabase Storage, using a URL
 * the server already signed.
 *
 * Nothing here touches `supabase.auth`. That is the point: resolving a bearer
 * token in the browser means `auth.getSession()`, which waits on the GoTrue
 * Web Lock with no timeout, and a lock held elsewhere in the app used to stall
 * this upload until the 60 second race fired with no request ever sent. The
 * signed token carries the permission instead, so a held lock cannot reach us.
 */
export async function uploadImage(
  file: File,
  { bucket, path, token }: UploadImageOptions
): Promise<UploadResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

  try {
    const supabase = createUploadClient(controller.signal)

    const { data, error } = await withTimeout(
      supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
        cacheControl: '3600',
        contentType: file.type,
      }),
      UPLOAD_TIMEOUT_MS,
      TIMEOUT_MESSAGE
    )

    if (error) {
      // storage-js catches the abort and turns it into a StorageUnknownError
      // whose message is whatever the browser called it, so the signal is the
      // truth here, not the text.
      if (controller.signal.aborted) {
        return { url: null, error: TIMEOUT_MESSAGE, retryable: false }
      }

      return { url: null, error: error.message, retryable: isRetryable(error) }
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return { url: publicUrl, error: null, retryable: false }
  } catch (error: unknown) {
    return { url: null, error: getErrorMessage(error, 'Upload failed'), retryable: false }
  } finally {
    clearTimeout(timer)
    // Cancels the request on the backstop path too, and is a no-op once the
    // response has already arrived.
    controller.abort()
  }
}

/**
 * Deletes an object addressed by its public URL.
 *
 * Still on the browser client, and so still exposed to the auth lock, because
 * this only ever runs fire-and-forget from an error path. A stall here is
 * invisible to the user and blocks no form.
 */
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

export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * `canvas.toBlob` is not cancellable. This bound exists so a stalled encode
 * surfaces the original file instead of leaving the caller's spinner running
 * forever.
 */
const OPTIMIZE_TIMEOUT_MS = 15_000

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

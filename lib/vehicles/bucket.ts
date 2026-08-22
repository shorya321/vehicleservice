/**
 * Kept in its own module so server-only code can name the bucket without
 * importing `lib/vehicles/image-upload.ts`, which pulls in the browser
 * Supabase client.
 */
export const VEHICLE_BUCKET = 'vehicles'

/**
 * Extensions the `vehicles` bucket accepts, keyed by the MIME type the browser
 * reports. `optimizeImage` emits `image/jpeg`, but it falls back to the
 * original file when the canvas is unavailable or the encode stalls, so a PNG
 * or WebP can still reach the upload. Naming every one of those `.jpg`, which
 * is what the path used to hardcode, stored bytes under a lying extension.
 */
export const VEHICLE_IMAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Falls back to jpg, matching what `optimizeImage` produces on the happy path. */
export function vehicleImageExtension(mimeType: string): string {
  return VEHICLE_IMAGE_EXTENSIONS[mimeType] ?? 'jpg'
}

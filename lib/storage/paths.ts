/**
 * Derives the object path inside `bucket` from a Supabase public storage URL.
 *
 * Kept free of any Supabase client import so server code (which needs the
 * service-role client) and browser code can both use it.
 *
 * Legacy vehicle images were written to `vehicles/{businessId}/{vehicleId}/...`
 * inside the `vehicles` bucket, producing a doubled prefix in the public URL.
 * Splitting on the bucket segment handles both those and current paths.
 */
export function storagePathFromUrl(url: string, bucket: string): string | null {
  const marker = `/${bucket}/`
  const index = url.indexOf(marker)

  if (index === -1) {
    return null
  }

  const path = url.slice(index + marker.length)

  return path.length > 0 ? path : null
}

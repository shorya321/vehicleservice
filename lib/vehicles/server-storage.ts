import { createAdminClient } from '@/lib/supabase/admin'
import { storagePathFromUrl } from '@/lib/storage/paths'
import { VEHICLE_BUCKET } from './image-upload'

/**
 * Server-only. Removes vehicle images with the service-role client.
 *
 * Service-role is required for two reasons: the caller may be deleting a
 * legacy object under the old doubled `vehicles/vehicles/...` prefix, whose
 * first path segment is not a vendor id and therefore fails the folder-scoped
 * storage policy; and an admin deleting a vendor's vehicle is not that vendor.
 *
 * Best-effort: a storage failure is logged, never surfaced. The database row
 * is the source of truth, and a leftover object is recoverable by a sweep
 * (scripts/sweep-orphaned-vehicle-images.ts) whereas a blocked delete is not.
 */
export async function removeVehicleImages(urls: (string | null | undefined)[]): Promise<void> {
  const paths = urls
    .filter((url): url is string => Boolean(url))
    .map((url) => {
      const path = storagePathFromUrl(url, VEHICLE_BUCKET)
      if (!path) console.error('Could not derive storage path from URL:', url)
      return path
    })
    .filter((path): path is string => Boolean(path))

  if (paths.length === 0) return

  const { error } = await createAdminClient().storage.from(VEHICLE_BUCKET).remove(paths)

  if (error) {
    console.error('Error removing vehicle images:', error.message)
  }
}

export async function removeVehicleImage(url: string): Promise<void> {
  return removeVehicleImages([url])
}

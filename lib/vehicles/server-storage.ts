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

/**
 * The image URLs of every vehicle owned by these users, keyed by user id.
 *
 * Deleting a user cascades away their vehicles with no application code in the
 * loop: auth.users -> profiles -> vendor_applications -> vehicles, all CASCADE.
 * Callers must collect the URLs BEFORE the delete, because the cascade destroys
 * the only record of them.
 *
 * Service-role: an admin deleting a vendor is not that vendor, so RLS would
 * hide the rows.
 */
export async function getVehicleImageUrlsForUsers(
  userIds: string[]
): Promise<Map<string, string[]>> {
  const byUser = new Map<string, string[]>()

  if (userIds.length === 0) return byUser

  const adminClient = createAdminClient()

  const { data: applications, error: applicationsError } = await adminClient
    .from('vendor_applications')
    .select('id, user_id')
    .in('user_id', userIds)

  if (applicationsError) {
    console.error('Could not load vendor applications:', applicationsError.message)
    return byUser
  }

  if (!applications || applications.length === 0) return byUser

  const userIdByBusinessId = new Map(applications.map((a) => [a.id, a.user_id]))

  const { data: vehicles, error: vehiclesError } = await adminClient
    .from('vehicles')
    .select('business_id, primary_image_url')
    .in('business_id', applications.map((a) => a.id))

  if (vehiclesError) {
    console.error('Could not load vehicles:', vehiclesError.message)
    return byUser
  }

  for (const vehicle of vehicles ?? []) {
    if (!vehicle.primary_image_url) continue

    const userId = userIdByBusinessId.get(vehicle.business_id)
    if (!userId) continue

    byUser.set(userId, [...(byUser.get(userId) ?? []), vehicle.primary_image_url])
  }

  return byUser
}

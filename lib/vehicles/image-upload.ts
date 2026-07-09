import { deleteImageByUrl, optimizeImage, uploadImage, type UploadResult } from '@/lib/storage/image-upload'

export const VEHICLE_BUCKET = 'vehicles'

interface UploadVehicleImageArgs {
  businessId: string
  file: File
}

/**
 * Optimizes and uploads a vehicle's primary image from the browser.
 *
 * Path is `{businessId}/{uuid}.jpg`, matching the shape the admin upload
 * already used. The vendor server action previously wrote
 * `vehicles/{businessId}/{vehicleId}/...` inside the `vehicles` bucket, which
 * doubled the prefix in the public URL.
 */
export async function uploadVehicleImage({
  businessId,
  file,
}: UploadVehicleImageArgs): Promise<UploadResult> {
  try {
    const optimized = await optimizeImage(file)
    const path = `${businessId}/${crypto.randomUUID()}.jpg`

    return await uploadImage(optimized, { bucket: VEHICLE_BUCKET, path })
  } catch (error: unknown) {
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to process image',
    }
  }
}

/** Best-effort rollback of an upload whose vehicle row failed to save. */
export async function deleteVehicleImage(url: string): Promise<{ error: string | null }> {
  return deleteImageByUrl(url, VEHICLE_BUCKET)
}

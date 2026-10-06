import { storagePathFromUrl } from '@/lib/storage/paths'
import { VEHICLE_BUCKET } from '@/lib/vehicles/bucket'

/** CMS uploads share the public `vehicles` bucket with blog images, under their own folder. */
export const CMS_IMAGE_BUCKET = VEHICLE_BUCKET
export const CMS_IMAGE_FOLDER = 'cms'

/** Every string anywhere in a content tree that points at a CMS upload. */
export function collectCmsImageUrls(value: unknown): string[] {
  if (typeof value === 'string') {
    return isCmsImageUrl(value) ? [value] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectCmsImageUrls)
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectCmsImageUrls)
  }
  return []
}

export function isCmsImageUrl(url: string): boolean {
  const path = storagePathFromUrl(url, CMS_IMAGE_BUCKET)
  return path !== null && path.startsWith(`${CMS_IMAGE_FOLDER}/`)
}

/** Uploads present before a save and gone after it, safe to delete. */
export function removedCmsImages(before: unknown, after: unknown): string[] {
  const kept = new Set(collectCmsImageUrls(after))
  return Array.from(new Set(collectCmsImageUrls(before))).filter((url) => !kept.has(url))
}

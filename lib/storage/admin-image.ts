import { createAdminClient } from '@/lib/supabase/admin'
import { storagePathFromUrl } from './paths'

/**
 * Removes a storage object addressed by its public URL, using the service-role
 * client so RLS cannot block the cleanup.
 *
 * Server-only: never import this from a client component.
 *
 * Never throws. Callers run this *after* the owning row has already been
 * updated, so a storage hiccup must degrade to an orphaned file rather than
 * failing a committed write. URLs that do not belong to `bucket` (external
 * hosts, hand-entered links) are ignored.
 */
export async function deleteAdminImageByUrl(url: string, bucket: string): Promise<void> {
  const path = storagePathFromUrl(url, bucket)

  if (!path) {
    return
  }

  try {
    const { error } = await createAdminClient().storage.from(bucket).remove([path])

    if (error) {
      console.error(`[storage] Failed to remove ${bucket}/${path}:`, error.message)
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[storage] Unexpected error removing ${bucket}/${path}:`, message)
  }
}

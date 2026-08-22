"use server"

import { createClient } from '@/lib/supabase/server'
import { VEHICLE_BUCKET, VEHICLE_IMAGE_EXTENSIONS } from './bucket'

const DENIED = 'You are not allowed to upload images for this business.'
const UNAUTHENTICATED = 'Your session has expired. Sign in again to continue.'

/**
 * Mints a one-time signed URL for a vehicle image upload.
 *
 * The browser used to upload under its own session, which meant resolving a
 * bearer token through `auth.getSession()`, which waits on the GoTrue Web Lock
 * with no timeout. Signing here moves the only authenticated step to the
 * server, where there is no such lock, and the browser then writes with a
 * token instead of a session.
 *
 * The path is built here too, so the browser no longer chooses where it
 * writes. The storage policy still scopes the folder, this is the second lock
 * on the same door.
 */
export async function signVehicleImageUpload(
  businessId: string,
  mimeType: string
): Promise<{ path: string | null; token: string | null; error: string | null }> {
  const extension = VEHICLE_IMAGE_EXTENSIONS[mimeType]

  if (!extension) {
    return { path: null, token: null, error: 'That image format is not supported.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { path: null, token: null, error: UNAUTHENTICATED }
  }

  const allowed = await canWriteVehicleImages(supabase, user.id, businessId)

  if (!allowed) {
    return { path: null, token: null, error: DENIED }
  }

  const path = `${businessId}/${crypto.randomUUID()}.${extension}`
  const { data, error } = await supabase.storage
    .from(VEHICLE_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    return { path: null, token: null, error: error?.message ?? 'Could not start the upload.' }
  }

  return { path: data.path, token: data.token, error: null }
}

/**
 * Mirrors the live storage INSERT policy "Vendors and admins can upload
 * vehicle images": an admin, or the owner of an approved application whose id
 * is the folder being written to.
 *
 * `user_id` is checked explicitly rather than leaning on RLS, because the
 * "Public can view approved vendors" policy lets any authenticated user read
 * any approved application row.
 */
async function canWriteVehicleImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  businessId: string
): Promise<boolean> {
  const { data: application } = await supabase
    .from('vendor_applications')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', userId)
    .eq('status', 'approved')
    .maybeSingle()

  if (application) {
    return true
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return profile?.role === 'admin'
}

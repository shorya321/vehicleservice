'use server'

import { createClient } from '@/lib/supabase/server'
import { 
  Route, 
  RouteInsert,
  RouteWithDetails,
  RouteFilters,
  PaginatedRoutes 
} from '@/lib/types/route'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/supabase/types'
import { deleteAdminImageByUrl } from '@/lib/storage/admin-image'
import { uploadRouteImage } from './actions/upload'

const PAGE_SIZE = 10

/** The bucket every admin-managed content image is written to. */
const IMAGE_BUCKET = 'vehicles'

/**
 * What the route form submits.
 *
 * `imageBase64` and `existingImage` are not columns, so they are stripped
 * before the row is written. The form's contract: `imageBase64` set means a new
 * upload, `existingImage` set means keep the URL already on the row, and both
 * null means the admin removed the image.
 */
export interface RouteFormData
  extends Omit<RouteInsert, 'id' | 'created_at' | 'updated_at' | 'image_url'> {
  imageBase64?: string | null
  existingImage?: string | null
}

/**
 * Removes storage objects that no row points at any more.
 *
 * Runs only after the owning write has committed, which is what
 * `deleteAdminImageByUrl` is built for: it never throws, so a storage hiccup
 * degrades to an orphaned file rather than failing a write that already
 * succeeded. The reference count guards the case where two routes were saved
 * with the same URL.
 */
async function releaseRouteImages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  urls: (string | null | undefined)[]
): Promise<void> {
  // Array.from, not a bare for-of over the Set: tsconfig targets ES5, where a
  // Set is not directly iterable.
  const unique = Array.from(new Set(urls.filter((u): u is string => Boolean(u))))

  for (const url of unique) {
    const { count } = await supabase
      .from('routes')
      .select('id', { count: 'exact', head: true })
      .eq('image_url', url)

    if (count === 0) {
      await deleteAdminImageByUrl(url, IMAGE_BUCKET)
    }
  }
}

export async function getRoutes(filters: RouteFilters = {}): Promise<PaginatedRoutes> {
  const supabase = await createClient()
  const page = filters.page || 1
  const limit = filters.limit || PAGE_SIZE
  const offset = (page - 1) * limit

  let query = supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `, { count: 'exact' })

  // Apply filters
  if (filters.search) {
    query = query.or(`route_name.ilike.%${filters.search}%,route_slug.ilike.%${filters.search}%`)
  }

  if (filters.originLocationId) {
    query = query.eq('origin_location_id', filters.originLocationId)
  }

  if (filters.destinationLocationId) {
    query = query.eq('destination_location_id', filters.destinationLocationId)
  }

  if (filters.isActive !== 'all' && filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  if (filters.isPopular !== 'all' && filters.isPopular !== undefined) {
    query = query.eq('is_popular', filters.isPopular)
  }

  // Apply pagination
  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching routes:', error)
    throw new Error('Failed to fetch routes')
  }

  const routesWithDetails: RouteWithDetails[] = (data || []).map(route => ({
    ...route,
  }))

  return {
    routes: routesWithDetails,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getRoute(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('routes')
    .select(`
      *,
      origin_location:locations!origin_location_id(*),
      destination_location:locations!destination_location_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching route:', error)
    throw new Error('Failed to fetch route')
  }

  return data
}

export async function createRoute(data: RouteFormData) {
  const supabase = await createClient()

  const { imageBase64, existingImage, ...columns } = data

  // Validate that origin and destination are different
  if (columns.origin_location_id === columns.destination_location_id) {
    throw new Error('Origin and destination must be different')
  }

  // Generate slug if not provided
  if (!columns.route_slug) {
    columns.route_slug = generateSlug(columns.route_name)
  }

  // The upload precedes the insert because it is the step that can fail for a
  // reason the admin can act on. Uploading afterwards would leave a created
  // route silently without its photo.
  let imageUrl = existingImage || null
  if (imageBase64) {
    const upload = await uploadRouteImage(columns.route_slug, imageBase64)
    if (upload.error) {
      throw new Error(upload.error)
    }
    imageUrl = upload.imageUrl
  }

  const { data: route, error } = await supabase
    .from('routes')
    .insert({
      ...columns,
      image_url: imageUrl,
      image_alt: imageUrl ? columns.image_alt ?? null : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating route:', error)

    // A duplicate slug or endpoint pair is the common failure here, and the
    // photo was already written. Nothing points at it, so drop it rather than
    // leave a file behind on every rejected attempt.
    if (imageBase64 && imageUrl) {
      await deleteAdminImageByUrl(imageUrl, IMAGE_BUCKET)
    }

    if (error.code === '23505') {
      if (error.message.includes('route_slug')) {
        throw new Error('A route with this slug already exists')
      }
      if (error.message.includes('unique_route_combination')) {
        throw new Error('A route between these locations already exists')
      }
    }
    throw new Error('Failed to create route')
  }

  revalidatePath('/admin/routes')
  revalidatePath('/routes')
  return route
}

export async function updateRoute(id: string, data: Partial<RouteFormData>) {
  const supabase = await createClient()

  const { imageBase64, existingImage, ...columns } = data

  // Validate that origin and destination are different if both are provided
  if (columns.origin_location_id && columns.destination_location_id &&
      columns.origin_location_id === columns.destination_location_id) {
    throw new Error('Origin and destination must be different')
  }

  // Read the current image before overwriting it, so the old storage object can
  // be cleaned up once the update commits. The form only sends back
  // `existingImage` when the image is unchanged, so it can't be relied on here.
  // The slug comes from the same read, because a partial update need not carry
  // one and the upload path is built from it.
  const { data: existing } = await supabase
    .from('routes')
    .select('image_url, route_slug')
    .eq('id', id)
    .single()

  let imageUrl = existingImage || null
  if (imageBase64) {
    const upload = await uploadRouteImage(
      columns.route_slug || existing?.route_slug || id,
      imageBase64
    )
    if (upload.error) {
      throw new Error(upload.error)
    }
    imageUrl = upload.imageUrl
  }

  const { data: route, error } = await supabase
    .from('routes')
    .update({
      ...columns,
      image_url: imageUrl,
      // Alt text describes a photo. With no photo it describes nothing, and
      // leaving it behind shows the next admin a caption for an image that is
      // no longer there.
      image_alt: imageUrl ? columns.image_alt ?? null : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating route:', error)

    if (imageBase64 && imageUrl) {
      await deleteAdminImageByUrl(imageUrl, IMAGE_BUCKET)
    }

    if (error.code === '23505') {
      if (error.message.includes('route_slug')) {
        throw new Error('A route with this slug already exists')
      }
      if (error.message.includes('unique_route_combination')) {
        throw new Error('A route between these locations already exists')
      }
    }
    throw new Error('Failed to update route')
  }

  // Only after the row commits, and only if nothing else still points at it.
  if (existing?.image_url && existing.image_url !== imageUrl) {
    await releaseRouteImages(supabase, [existing.image_url])
  }

  revalidatePath('/admin/routes')
  revalidatePath('/routes')
  revalidatePath(`/admin/routes/${id}/edit`)
  return route
}

export async function deleteRoute(id: string) {
  const supabase = await createClient()

  // Read the photo before the row goes, or there is nothing left to find it by.
  const { data: existing } = await supabase
    .from('routes')
    .select('image_url')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('routes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting route:', error)
    throw new Error('Failed to delete route')
  }

  await releaseRouteImages(supabase, [existing?.image_url])

  revalidatePath('/admin/routes')
  revalidatePath('/routes')
}

export async function toggleRouteStatus(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('routes')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling route status:', error)
    throw new Error('Failed to update route status')
  }

  revalidatePath('/admin/routes')
  revalidatePath('/routes')
}

export async function toggleRoutePopular(id: string, isPopular: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('routes')
    .update({ is_popular: isPopular })
    .eq('id', id)

  if (error) {
    console.error('Error toggling route popular status:', error)
    throw new Error('Failed to update route popular status')
  }

  revalidatePath('/admin/routes')
  revalidatePath('/routes')
}

export async function getPopularRoutes(limit: number = 10) {
  const supabase = await createClient()

  // Use the database function we created
  const { data, error } = await supabase
    .rpc('get_popular_routes', {
      limit_count: limit
    })

  if (error) {
    console.error('Error fetching popular routes:', error)
    throw new Error('Failed to fetch popular routes')
  }

  return data
}

export async function bulkDeleteRoutes(ids: string[]) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }

  const { data: existing } = await supabase
    .from('routes')
    .select('image_url')
    .in('id', ids)

  const { error } = await supabase
    .from('routes')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error bulk deleting routes:', error)
    throw new Error('Failed to delete routes')
  }

  await releaseRouteImages(supabase, (existing || []).map((r) => r.image_url))

  revalidatePath('/admin/routes')
  revalidatePath('/routes')
  return { count: ids.length }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
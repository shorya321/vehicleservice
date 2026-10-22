'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/auth/admin-action'
import type { Database } from '@/lib/supabase/types'

export interface Zone {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  location_count?: number
}

type ZoneRow = Database['public']['Tables']['zones']['Row']

/** The columns are nullable with defaults; the admin UI reads them as always set. */
function toZone(row: ZoneRow): Zone {
  return {
    ...row,
    sort_order: row.sort_order ?? 0,
    is_active: row.is_active ?? false,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  }
}

export interface ZoneFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface PaginatedZones {
  zones: Zone[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ZonePricing {
  id: string
  from_zone_id: string
  to_zone_id: string
  base_price: number
  currency: string
  is_active: boolean
  from_zone?: Zone
  to_zone?: Zone
}

// Only the columns the pricing matrix actually reads. The matrix renders one
// cell per zone pair, so this grows quadratically with zone count. Fetching
// the full row plus both zone embeds is wasted bytes at 841 rows and up.
export type ZonePricingCell = Pick<
  ZonePricing,
  'from_zone_id' | 'to_zone_id' | 'base_price'
>

const PAGE_SIZE = 10

/**
 * Admin check for every export below. RLS already limits writes to admins, but
 * a blocked write reports success with zero rows, and the proxy's /admin gate
 * should not be the only check. Returns the message to show, or null for an
 * admin. Not exported, so it is not itself callable as a Server Action.
 */
async function adminDenial(): Promise<string | null> {
  const auth = await requireAdminAction()
  return 'error' in auth ? auth.error : null
}

export async function getZones(filters: ZoneFilters = {}): Promise<PaginatedZones> {
  const denied = await adminDenial()
  if (denied) return { zones: [], total: 0, page: filters.page || 1, limit: filters.limit || PAGE_SIZE, totalPages: 0 }

  const supabase = await createClient()
  const page = filters.page || 1
  const limit = filters.limit || PAGE_SIZE
  const offset = (page - 1) * limit

  let query = supabase
    .from('zones')
    .select(`
      *,
      locations(count)
    `, { count: 'exact' })

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
  }

  if (filters.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filters.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  query = query
    .order('sort_order')
    .order('name')
    .range(offset, offset + limit - 1)

  const { data: zones, error, count } = await query

  if (error) {
    console.error('Error fetching zones:', error)
    return { zones: [], total: 0, page, limit, totalPages: 0 }
  }

  const total = count || 0

  return {
    zones: (zones || []).map(({ locations, ...zone }) => ({
      ...toZone(zone),
      location_count: locations?.[0]?.count || 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getZone(id: string): Promise<Zone | null> {
  const denied = await adminDenial()
  if (denied) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching zone:', error)
    return null
  }

  return toZone(data)
}

export async function createZone(formData: FormData) {
  const denied = await adminDenial()
  if (denied) return { error: denied }

  const supabase = await createClient()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'true'

  const { error } = await supabase
    .from('zones')
    .insert({
      name,
      slug,
      description: description || null,
      sort_order,
      is_active
    })

  if (error) {
    console.error('Error creating zone:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  return { success: true }
}

export async function updateZone(id: string, formData: FormData) {
  const denied = await adminDenial()
  if (denied) return { error: denied }

  const supabase = await createClient()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const is_active = formData.get('is_active') === 'true'

  const { error } = await supabase
    .from('zones')
    .update({
      name,
      slug,
      description: description || null,
      sort_order,
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating zone:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  revalidatePath(`/admin/zones/${id}`)
  return { success: true }
}

export async function deleteZone(id: string) {
  const denied = await adminDenial()
  if (denied) return { error: denied }

  const supabase = await createClient()

  // Check if zone has locations assigned
  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('zone_id', id)
    .limit(1)

  if (locations && locations.length > 0) {
    return { error: 'Cannot delete zone with assigned locations' }
  }

  // Check if zone has pricing rules
  const { data: pricing } = await supabase
    .from('zone_pricing')
    .select('id')
    .or(`from_zone_id.eq.${id},to_zone_id.eq.${id}`)
    .limit(1)

  if (pricing && pricing.length > 0) {
    return { error: 'Cannot delete zone with pricing rules' }
  }

  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting zone:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  return { success: true }
}

export async function getZonePricing(): Promise<ZonePricingCell[]> {
  const denied = await adminDenial()
  if (denied) return []

  const supabase = await createClient()

  // The caller builds a `from|to -> price` Map, so order is irrelevant and the
  // zone embeds are unused. Range is explicit because PostgREST silently caps
  // an unbounded select at ~1000 rows, which the N x N matrix will outgrow.
  const { data, error } = await supabase
    .from('zone_pricing')
    .select('from_zone_id, to_zone_id, base_price')
    .range(0, 9999)

  if (error) {
    console.error('Error fetching zone pricing:', error)
    return []
  }

  return data
}

export async function updateZonePricing(
  fromZoneId: string,
  toZoneId: string,
  price: number
) {
  const denied = await adminDenial()
  if (denied) return { error: denied }

  const supabase = await createClient()

  try {
    // First verify both zones exist
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('id, name')
      .in('id', [fromZoneId, toZoneId])

    if (zonesError) {
      console.error('Error verifying zones:', zonesError)
      return { error: `Failed to verify zones: ${zonesError.message}` }
    }

    // Handle same-zone pricing (e.g., Zone F → Zone F)
    const isSameZone = fromZoneId === toZoneId
    const expectedZoneCount = isSameZone ? 1 : 2

    if (!zones || zones.length !== expectedZoneCount) {
      return { error: 'One or both zones do not exist' }
    }

    // Check if pricing exists
    const { data: existing, error: checkError } = await supabase
      .from('zone_pricing')
      .select('id')
      .eq('from_zone_id', fromZoneId)
      .eq('to_zone_id', toZoneId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing pricing:', checkError)
      return { error: `Failed to check existing pricing: ${checkError.message}` }
    }

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('zone_pricing')
        .update({
          base_price: price,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating zone pricing:', error)
        return { error: `Failed to update pricing: ${error.message}` }
      }
    } else {
      // Create new - only if price is greater than 0
      if (price <= 0) {
        // Skip creating pricing for 0 or negative values
        return { success: true }
      }

      const { error } = await supabase
        .from('zone_pricing')
        .insert({
          from_zone_id: fromZoneId,
          to_zone_id: toZoneId,
          base_price: price,
          currency: 'AED',
          is_active: true
        })

      if (error) {
        console.error('Error creating zone pricing:', error)
        // Check for specific error types
        if (error.code === '23505') {
          return { error: 'Pricing for this zone combination already exists' }
        }
        if (error.code === '23503') {
          return { error: 'Invalid zone reference' }
        }
        return { error: `Failed to create pricing: ${error.message}` }
      }
    }

    revalidatePath('/admin/zones/pricing')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateZonePricing:', error)
    return { error: 'An unexpected error occurred while updating pricing' }
  }
}

export async function toggleZoneStatus(id: string, is_active: boolean) {
  const denied = await adminDenial()
  if (denied) return { error: denied }

  const supabase = await createClient()

  const { error } = await supabase
    .from('zones')
    .update({
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error toggling zone status:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  return { success: true }
}

export async function bulkDeleteZones(ids: string[]) {
  const denied = await adminDenial()
  if (denied) return { error: denied }

  const supabase = await createClient()

  const { error } = await supabase
    .from('zones')
    .delete()
    .in('id', ids)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  return { success: true, count: ids.length }
}

export async function bulkToggleZoneStatus(ids: string[], is_active: boolean) {
  const denied = await adminDenial()
  if (denied) return { error: denied }

  const supabase = await createClient()

  const { error } = await supabase
    .from('zones')
    .update({ is_active, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  return { success: true, count: ids.length }
}
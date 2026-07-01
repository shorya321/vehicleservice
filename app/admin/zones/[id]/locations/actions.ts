'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 10

export interface LocationWithZone {
  id: string
  name: string
  city: string | null
  country_code: string
  zone_id: string | null
  zone_name?: string
  location_type_label?: string
}

export interface PaginatedLocationsWithZones {
  locations: LocationWithZone[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LocationZoneFilters {
  search?: string
  zoneFilter?: string
  page?: number
  limit?: number
}

export async function getLocationsWithZones(
  filters: LocationZoneFilters = {}
): Promise<PaginatedLocationsWithZones> {
  const supabase = await createClient()
  const page = filters.page || 1
  const limit = filters.limit || PAGE_SIZE
  const offset = (page - 1) * limit

  let query = supabase
    .from('locations')
    .select(`
      id,
      name,
      city,
      country_code,
      zone_id,
      zones(name),
      location_types(label)
    `, { count: 'exact' })

  if (filters.search) {
    const search = `%${filters.search}%`
    query = query.or(`name.ilike.${search},city.ilike.${search},country_code.ilike.${search}`)
  }

  if (filters.zoneFilter && filters.zoneFilter !== 'all') {
    if (filters.zoneFilter === 'unassigned') {
      query = query.is('zone_id', null)
    } else {
      query = query.eq('zone_id', filters.zoneFilter)
    }
  }

  query = query
    .order('name')
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching locations:', error)
    return { locations: [], total: 0, page, limit, totalPages: 0 }
  }

  const total = count || 0

  return {
    locations: (data || []).map(location => ({
      id: location.id,
      name: location.name,
      city: location.city,
      country_code: location.country_code,
      zone_id: location.zone_id,
      zone_name: location.zones?.name,
      location_type_label: (location as any).location_types?.label,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function assignLocationToZone(locationId: string, zoneId: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .update({ 
      zone_id: zoneId
    })
    .eq('id', locationId)

  if (error) {
    console.error('Error assigning location to zone:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  revalidatePath(`/admin/zones/${zoneId}/locations`)
  return { success: true }
}

export async function bulkAssignLocationsToZone(locationIds: string[], zoneId: string | null) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('locations')
    .update({ 
      zone_id: zoneId
    })
    .in('id', locationIds)

  if (error) {
    console.error('Error bulk assigning locations to zone:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/zones')
  revalidatePath(`/admin/zones/${zoneId}/locations`)
  return { success: true }
}
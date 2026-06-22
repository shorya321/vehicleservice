'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface LocationWithZone {
  id: string
  name: string
  city: string | null
  country_code: string
  zone_id: string | null
  zone_name?: string
  location_type_label?: string
}

export async function getLocationsWithZones(): Promise<LocationWithZone[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      city,
      country_code,
      zone_id,
      zones(name),
      location_types(label)
    `)
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    return []
  }

  return data.map(location => ({
    id: location.id,
    name: location.name,
    city: location.city,
    country_code: location.country_code,
    zone_id: location.zone_id,
    zone_name: location.zones?.name,
    location_type_label: (location as any).location_types?.label,
  }))
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
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface LocationWithZone {
  id: string
  name: string
  city: string
  country_code: string
  type: string
  zone_id: string | null
  zone_name?: string
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
      type,
      zone_id,
      zones(name)
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
    type: location.type,
    zone_id: location.zone_id,
    zone_name: location.zones?.name
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
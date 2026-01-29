'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function getZones(): Promise<Zone[]> {
  const supabase = await createClient()

  const { data: zones, error } = await supabase
    .from('zones')
    .select(`
      *,
      locations(count)
    `)
    .order('sort_order')
    .order('name')

  if (error) {
    console.error('Error fetching zones:', error)
    return []
  }

  // Transform the data to include location count
  return zones.map(zone => ({
    ...zone,
    location_count: zone.locations?.[0]?.count || 0
  }))
}

export async function getZone(id: string): Promise<Zone | null> {
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

  return data
}

export async function createZone(formData: FormData) {
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

export async function getZonePricing(): Promise<ZonePricing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zone_pricing')
    .select(`
      *,
      from_zone:zones!zone_pricing_from_zone_id_fkey(id, name, slug),
      to_zone:zones!zone_pricing_to_zone_id_fkey(id, name, slug)
    `)
    .order('base_price')

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
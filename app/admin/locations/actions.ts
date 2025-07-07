"use server"

import { createClient } from "@/lib/supabase/server"
import { 
  Location, 
  LocationFilters, 
  PaginatedLocations,
  LocationFormData
} from "@/lib/types/location"
import { revalidatePath } from "next/cache"

export async function getLocations(filters: LocationFilters = {}): Promise<PaginatedLocations> {
  const supabase = await createClient()
  
  const { 
    search = '', 
    type = 'all', 
    status = 'all',
    country = 'all',
    allowPickup,
    allowDropoff,
    page = 1, 
    limit = 10
  } = filters

  // Build query
  let query = supabase
    .from('locations')
    .select('*', { count: 'exact' })

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`)
  }

  // Apply type filter
  if (type !== 'all') {
    query = query.eq('type', type)
  }

  // Apply status filter  
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // Apply country filter
  if (country && country !== 'all') {
    query = query.eq('country_code', country)
  }

  // Apply service filters
  if (allowPickup !== null && allowPickup !== undefined) {
    query = query.eq('allow_pickup', allowPickup)
  }

  if (allowDropoff !== null && allowDropoff !== undefined) {
    query = query.eq('allow_dropoff', allowDropoff)
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query
    .order('name', { ascending: true })
    .range(from, to)

  const { data: locations, error, count } = await query

  if (error) {
    console.error('Error fetching locations:', error)
    throw new Error('Failed to fetch locations')
  }

  return {
    locations: locations || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function createLocation(data: LocationFormData) {
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

  const { data: location, error } = await supabase
    .from('locations')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating location:', error)
    throw new Error('Failed to create location')
  }

  revalidatePath('/admin/locations')
  return location
}

export async function updateLocation(id: string, data: Partial<LocationFormData>) {
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

  const { data: location, error } = await supabase
    .from('locations')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating location:', error)
    throw new Error('Failed to update location')
  }

  revalidatePath('/admin/locations')
  revalidatePath(`/admin/locations/${id}/edit`)
  return location
}

export async function deleteLocation(id: string) {
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

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting location:', error)
    throw new Error('Failed to delete location')
  }

  revalidatePath('/admin/locations')
}

export async function getCountries(): Promise<string[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('locations')
    .select('country_code')
    .order('country_code')

  if (error) {
    console.error('Error fetching countries:', error)
    return []
  }

  // Get unique country codes
  const uniqueCountries = [...new Set(data?.map(item => item.country_code) || [])]
  return uniqueCountries
}

export async function bulkDeleteLocations(ids: string[]) {
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

  const { error } = await supabase
    .from('locations')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error bulk deleting locations:', error)
    throw new Error('Failed to delete locations')
  }

  revalidatePath('/admin/locations')
  return { success: true, count: ids.length }
}
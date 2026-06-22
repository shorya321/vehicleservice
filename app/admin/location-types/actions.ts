'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'
import { LocationTypeRecord, LocationTypeColorConfig } from '@/lib/types/location-type'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export interface LocationTypeStats {
  total: number
  active: number
  inactive: number
}

export interface LocationTypeFilters {
  search?: string
  status?: string
  page?: number
  limit?: number
}

export interface PaginatedLocationTypes {
  locationTypes: LocationTypeRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const PAGE_SIZE = 10

export async function getLocationTypesAdmin(
  filters: LocationTypeFilters = {}
): Promise<PaginatedLocationTypes> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()
  const page = filters.page || 1
  const limit = filters.limit || PAGE_SIZE
  const offset = (page - 1) * limit

  let query = supabase
    .from('location_types')
    .select('*', { count: 'exact' })

  if (filters.search) {
    query = query.or(`label.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
  }

  if (filters.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filters.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  query = query
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count || 0

  return {
    locationTypes: (data || []) as LocationTypeRecord[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getLocationTypeStats(): Promise<LocationTypeStats> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { data, error } = await supabase
    .from('location_types')
    .select('id, is_active')

  if (error) throw new Error(error.message)

  const types = (data || []) as { id: string; is_active: boolean }[]
  const active = types.filter((t) => t.is_active).length

  return {
    total: types.length,
    active,
    inactive: types.length - active,
  }
}

export async function getLocationTypeById(
  id: string
): Promise<LocationTypeRecord | null> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { data, error } = await supabase
    .from('location_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as LocationTypeRecord
}

export async function createLocationType(input: {
  name: string
  label: string
  icon_name: string
  color_config: LocationTypeColorConfig
  abbreviation: string
  sort_order: number
  is_active: boolean
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { error } = await supabase.from('location_types').insert({
    name: input.name.toLowerCase().replace(/\s+/g, '-'),
    label: input.label,
    icon_name: input.icon_name,
    color_config: input.color_config,
    abbreviation: input.abbreviation.toUpperCase(),
    sort_order: input.sort_order,
    is_active: input.is_active,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A location type with that name or abbreviation already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/location-types')
  revalidatePath('/admin/locations')
  return { success: true }
}

export async function updateLocationType(
  id: string,
  input: {
    label: string
    icon_name: string
    color_config: LocationTypeColorConfig
    abbreviation: string
    sort_order: number
    is_active: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { error } = await supabase
    .from('location_types')
    .update({
      label: input.label,
      icon_name: input.icon_name,
      color_config: input.color_config,
      abbreviation: input.abbreviation.toUpperCase(),
      sort_order: input.sort_order,
      is_active: input.is_active,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A location type with that abbreviation already exists' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/location-types')
  revalidatePath('/admin/locations')
  return { success: true }
}

export async function deleteLocationType(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { count } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('location_type_id', id)

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete — ${count} location(s) use this type. Reassign them first or deactivate instead.`,
    }
  }

  const { error } = await supabase
    .from('location_types')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/location-types')
  revalidatePath('/admin/locations')
  return { success: true }
}

export async function toggleLocationTypeStatus(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const supabase: AnyClient = await createClient()

  const { error } = await supabase
    .from('location_types')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/location-types')
  revalidatePath('/admin/locations')
  return { success: true }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'
import { VehicleType, VehicleTypeWithCategory } from '@/lib/types/vehicle'
import { uploadVehicleTypeImage } from './actions/upload'

export interface VehicleTypeFilters {
  search?: string
  categoryId?: string | 'all'
  isActive?: boolean | 'all'
  page?: number
  limit?: number
}

export interface PaginatedVehicleTypes {
  vehicleTypes: VehicleTypeWithCategory[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getVehicleTypes(
  filters: VehicleTypeFilters = {}
): Promise<PaginatedVehicleTypes> {
  await requireAdmin()
  const supabase = await createClient()

  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  // Build query
  let query = supabase
    .from('vehicle_types')
    .select(`
      *,
      category:category_id(*)
    `, { count: 'exact' })

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
  }

  if (filters.categoryId && filters.categoryId !== 'all') {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.isActive !== undefined && filters.isActive !== 'all') {
    query = query.eq('is_active', filters.isActive)
  }

  // Add sorting and pagination
  query = query
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    vehicleTypes: (data || []) as VehicleTypeWithCategory[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getVehicleType(id: string): Promise<VehicleTypeWithCategory | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicle_types')
    .select(`
      *,
      category:category_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehicle type:', error)
    return null
  }

  return data as VehicleTypeWithCategory
}

export interface VehicleTypeFormData {
  name: string
  slug: string
  description?: string
  category_id?: string
  passenger_capacity: number
  luggage_capacity: number
  price_multiplier?: number
  business_price_multiplier?: number
  sort_order?: number
  is_active: boolean
  imageBase64?: string | null
  existingImage?: string | null
}

export async function createVehicleType(data: VehicleTypeFormData) {
  await requireAdmin()
  const supabase = await createClient()

  // Handle image upload if provided
  let imageUrl = null
  if (data.imageBase64) {
    const uploadResult = await uploadVehicleTypeImage(data.slug, data.imageBase64)
    if (uploadResult.error) {
      throw new Error(uploadResult.error)
    }
    imageUrl = uploadResult.imageUrl
  }

  const { error } = await supabase
    .from('vehicle_types')
    .insert({
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description || null,
      category_id: data.category_id || null,
      passenger_capacity: data.passenger_capacity,
      luggage_capacity: data.luggage_capacity,
      price_multiplier: data.price_multiplier || 1.0,
      business_price_multiplier: data.business_price_multiplier || 1.0,
      sort_order: data.sort_order || null,
      is_active: data.is_active,
      image_url: imageUrl
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/vehicle-types')
}

export async function updateVehicleType(id: string, data: VehicleTypeFormData) {
  await requireAdmin()
  const supabase = await createClient()

  // Handle image upload if provided
  let imageUrl = data.existingImage || null
  if (data.imageBase64) {
    const uploadResult = await uploadVehicleTypeImage(data.slug, data.imageBase64)
    if (uploadResult.error) {
      throw new Error(uploadResult.error)
    }
    imageUrl = uploadResult.imageUrl
  }

  const { error } = await supabase
    .from('vehicle_types')
    .update({
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description || null,
      category_id: data.category_id || null,
      passenger_capacity: data.passenger_capacity,
      luggage_capacity: data.luggage_capacity,
      price_multiplier: data.price_multiplier || 1.0,
      business_price_multiplier: data.business_price_multiplier || 1.0,
      sort_order: data.sort_order || null,
      is_active: data.is_active,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/vehicle-types')
  revalidatePath(`/admin/vehicle-types/${id}/edit`)
}

export async function deleteVehicleType(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Check if any vehicles are using this type
  const { count } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('vehicle_type_id', id)

  if (count && count > 0) {
    throw new Error(`Cannot delete vehicle type. ${count} vehicles are using this type.`)
  }

  // Check if any route pricing exists for this type
  const { count: pricingCount } = await supabase
    .from('route_vehicle_type_pricing')
    .select('*', { count: 'exact', head: true })
    .eq('vehicle_type_id', id)

  if (pricingCount && pricingCount > 0) {
    throw new Error(`Cannot delete vehicle type. ${pricingCount} route pricing entries exist for this type.`)
  }

  const { error } = await supabase
    .from('vehicle_types')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/vehicle-types')
}

export async function toggleVehicleTypeStatus(id: string, isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('vehicle_types')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/vehicle-types')
}

// Get all active vehicle types for form selects
export async function getActiveVehicleTypes() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicle_types')
    .select('id, name, passenger_capacity, luggage_capacity')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
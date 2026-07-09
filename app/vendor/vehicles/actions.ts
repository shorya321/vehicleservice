"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Vehicle, VehicleFilters } from "@/lib/types/vehicle"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { storagePathFromUrl } from "@/lib/storage/paths"
import {
  firstIssueMessage,
  vehicleMutationSchema,
  type VehicleMutationInput,
} from "@/lib/vehicles/schema"
import { revalidatePath } from "next/cache"

const VEHICLE_BUCKET = 'vehicles'

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505'

function toUserFacingError(
  error: { code?: string; message: string },
  registrationNumber: string
): string {
  if (error.code === UNIQUE_VIOLATION && error.message.includes('registration_number')) {
    return `A vehicle with registration number ${registrationNumber} is already registered.`
  }

  return error.message
}

/**
 * Removes a superseded image with the service-role client.
 *
 * Service-role is required because the caller may be deleting a legacy object
 * under the old doubled `vehicles/vehicles/...` prefix, and because storage
 * delete policies are scheduled to be scoped to the owning vendor.
 */
async function removeVehicleImage(url: string): Promise<void> {
  const path = storagePathFromUrl(url, VEHICLE_BUCKET)

  if (!path) {
    console.error('Could not derive storage path from URL:', url)
    return
  }

  const { error } = await createAdminClient().storage.from(VEHICLE_BUCKET).remove([path])

  if (error) {
    console.error('Error removing vehicle image:', error)
  }
}

export async function getVehicles(businessId: string, filters: VehicleFilters): Promise<{
  vehicles: (Vehicle & { category?: VehicleCategory | null })[]
  total: number
  page: number
  totalPages: number
}> {
  const supabase = await createClient()
  
  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('vehicles')
    .select(`
      *,
      category:vehicle_categories(*)
    `, { count: 'exact' })
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .range(from, to)

  // Search filter
  if (filters.search) {
    query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,registration_number.ilike.%${filters.search}%`)
  }

  // Status filter
  if (filters.status === 'available') {
    query = query.eq('is_available', true)
  } else if (filters.status === 'unavailable') {
    query = query.eq('is_available', false)
  }

  // Category filter
  if (filters.categoryId && filters.categoryId !== 'all') {
    query = query.eq('category_id', filters.categoryId)
  }

  // Fuel type filter
  if (filters.fuelType && filters.fuelType !== 'all') {
    query = query.eq('fuel_type', filters.fuelType)
  }

  // Transmission filter
  if (filters.transmission && filters.transmission !== 'all') {
    query = query.eq('transmission', filters.transmission)
  }

  // Price range filter
  if (filters.minPrice !== undefined) {
    query = query.gte('daily_rate', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('daily_rate', filters.maxPrice)
  }

  // Seats filter
  if (filters.seats) {
    query = query.eq('seats', filters.seats)
  }

  const { data: vehicles, error, count } = await query

  if (error) {
    console.error('Error fetching vehicles:', error)
    return { vehicles: [], total: 0, page, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    vehicles: vehicles || [],
    total,
    page,
    totalPages
  }
}

export async function toggleVehicleAvailability(
  vehicleId: string,
  businessId: string,
  isAvailable: boolean
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_available: isAvailable })
      .eq('id', vehicleId)
      .eq('business_id', businessId)

    if (error) {
      console.error('Error updating vehicle availability:', error)
      return { error: error.message }
    }

    revalidatePath('/vendor/vehicles')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteVehicle(vehicleId: string, businessId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('business_id', businessId)

    if (error) {
      console.error('Error deleting vehicle:', error)
      return { error: error.message }
    }

    revalidatePath('/vendor/vehicles')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function bulkDeleteVehicles(vehicleIds: string[], businessId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .in('id', vehicleIds)
      .eq('business_id', businessId)

    if (error) {
      console.error('Error deleting vehicles:', error)
      return { error: error.message }
    }

    revalidatePath('/vendor/vehicles')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function bulkToggleAvailability(
  vehicleIds: string[], 
  businessId: string, 
  isAvailable: boolean
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_available: isAvailable })
      .in('id', vehicleIds)
      .eq('business_id', businessId)

    if (error) {
      console.error('Error updating vehicles availability:', error)
      return { error: error.message }
    }

    revalidatePath('/vendor/vehicles')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function createVehicle(
  businessId: string,
  data: VehicleMutationInput
): Promise<{ success?: boolean; error?: string }> {
  const parsed = vehicleMutationSchema.safeParse(data)

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) }
  }

  const vehicle = parsed.data
  const supabase = await createClient()

  try {
    const { error } = await supabase.from('vehicles').insert({
      business_id: businessId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registration_number: vehicle.registration_number,
      category_id: vehicle.category_id,
      vehicle_type_id: vehicle.vehicle_type_id,
      fuel_type: vehicle.fuel_type || null,
      transmission: vehicle.transmission || null,
      seats: vehicle.seats || null,
      luggage_capacity: vehicle.luggage_capacity || 2,
      is_available: vehicle.is_available,
      primary_image_url: vehicle.primaryImageUrl,
    })

    if (error) {
      console.error('Error creating vehicle:', error)
      return { error: toUserFacingError(error, vehicle.registration_number) }
    }

    revalidatePath('/vendor/vehicles')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateVehicle(
  vehicleId: string,
  businessId: string,
  data: VehicleMutationInput
): Promise<{ success?: boolean; error?: string }> {
  const parsed = vehicleMutationSchema.safeParse(data)

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) }
  }

  const vehicle = parsed.data
  const supabase = await createClient()

  try {
    // Read the stored image rather than trusting the client's copy of it.
    const { data: existing, error: fetchError } = await supabase
      .from('vehicles')
      .select('primary_image_url')
      .eq('id', vehicleId)
      .eq('business_id', businessId)
      .single()

    if (fetchError) {
      console.error('Error loading vehicle:', fetchError)
      return { error: fetchError.message }
    }

    const { error } = await supabase
      .from('vehicles')
      .update({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        registration_number: vehicle.registration_number,
        category_id: vehicle.category_id,
        vehicle_type_id: vehicle.vehicle_type_id,
        fuel_type: vehicle.fuel_type || null,
        transmission: vehicle.transmission || null,
        seats: vehicle.seats || null,
        luggage_capacity: vehicle.luggage_capacity || 2,
        is_available: vehicle.is_available,
        primary_image_url: vehicle.primaryImageUrl,
      })
      .eq('id', vehicleId)
      .eq('business_id', businessId)

    if (error) {
      console.error('Error updating vehicle:', error)
      return { error: toUserFacingError(error, vehicle.registration_number) }
    }

    const previousImage = existing?.primary_image_url

    if (previousImage && previousImage !== vehicle.primaryImageUrl) {
      await removeVehicleImage(previousImage)
    }

    revalidatePath('/vendor/vehicles')
    revalidatePath(`/vendor/vehicles/${vehicleId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getVehicleCategories(): Promise<{ data?: VehicleCategory[]; error?: string }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vehicle_categories')
    .select('*')
    .order('sort_order')

  if (error) {
    console.error('Error fetching vehicle categories:', error)
    return { error: error.message }
  }

  return { data }
}


export async function getVehicleTypesByCategory(categoryId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching vehicle types:', error)
    return []
  }

  return data || []
}
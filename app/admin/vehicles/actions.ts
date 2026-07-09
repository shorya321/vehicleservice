"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { removeVehicleImage } from "@/lib/vehicles/server-storage"
import {
  adminVehicleMutationSchema,
  firstIssueMessage,
  type AdminVehicleMutationInput,
} from "@/lib/vehicles/schema"

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

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return 'Unauthorized'
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? null : 'Only admins can manage vehicles'
}

export interface AdminVehicleFilters {
  search?: string
  vendorId?: string | 'all'
  categoryId?: string | 'all'
  vehicleTypeId?: string | 'all'
  status?: 'all' | 'available' | 'unavailable'
  fuelType?: 'all' | 'petrol' | 'diesel' | 'electric' | 'hybrid'
  transmission?: 'all' | 'manual' | 'automatic'
  seats?: number
  page?: number
  limit?: number
}

export type AdminVehicleFormData = AdminVehicleMutationInput

export async function getAdminVehicles(filters: AdminVehicleFilters) {
  const supabase = await createClient()
  
  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('vehicles')
    .select(`
      *,
      category:vehicle_categories(*),
      vehicle_type:vehicle_types(*),
      vendor:vendor_applications(
        id,
        business_name,
        business_email,
        user:profiles!vendor_applications_user_id_fkey(
          full_name,
          email
        )
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  // Search filter
  if (filters.search) {
    query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,registration_number.ilike.%${filters.search}%`)
  }

  // Vendor filter
  if (filters.vendorId && filters.vendorId !== 'all') {
    query = query.eq('business_id', filters.vendorId)
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

  // Vehicle type filter
  if (filters.vehicleTypeId && filters.vehicleTypeId !== 'all') {
    query = query.eq('vehicle_type_id', filters.vehicleTypeId)
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
    totalPages,
  }
}

export async function getVendors() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vendor_applications')
    .select(`
      id,
      business_name,
      business_email,
      application_status:status,
      user:profiles!vendor_applications_user_id_fkey(
        full_name,
        email
      )
    `)
    .eq('status', 'approved')
    .order('business_name')

  if (error) {
    console.error('Error fetching vendors:', error)
    return { vendors: [] }
  }

  return { vendors: data || [] }
}

export async function getAdminVehicle(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      category:vehicle_categories(*),
      vehicle_type:vehicle_types(*),
      vendor:vendor_applications(
        id,
        business_name,
        business_email,
        user:profiles!vendor_applications_user_id_fkey(
          full_name,
          email
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehicle:', error)
    return { error: error.message }
  }

  return { vehicle: data }
}

export async function createAdminVehicle(formData: AdminVehicleFormData) {
  const parsed = adminVehicleMutationSchema.safeParse(formData)

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) }
  }

  const vehicle = parsed.data
  const supabase = await createClient()

  const authError = await requireAdmin(supabase)
  if (authError) {
    return { error: authError }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert([{
      business_id: vehicle.business_id,
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
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating vehicle:', error)
    return { error: toUserFacingError(error, vehicle.registration_number) }
  }

  revalidatePath('/admin/vehicles')
  revalidatePath('/vendor/vehicles')
  return { data }
}

export async function updateAdminVehicle(id: string, formData: AdminVehicleFormData) {
  const parsed = adminVehicleMutationSchema.safeParse(formData)

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) }
  }

  const vehicle = parsed.data
  const supabase = await createClient()

  const authError = await requireAdmin(supabase)
  if (authError) {
    return { error: authError }
  }

  // Read the stored image rather than trusting the client's copy of it.
  const { data: existing, error: fetchError } = await supabase
    .from('vehicles')
    .select('primary_image_url')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error loading vehicle:', fetchError)
    return { error: fetchError.message }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({
      business_id: vehicle.business_id,
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
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehicle:', error)
    return { error: toUserFacingError(error, vehicle.registration_number) }
  }

  const previousImage = existing?.primary_image_url

  if (previousImage && previousImage !== vehicle.primaryImageUrl) {
    await removeVehicleImage(previousImage)
  }

  revalidatePath('/admin/vehicles')
  revalidatePath(`/admin/vehicles/${id}/edit`)
  revalidatePath('/vendor/vehicles')
  return { data }
}

export async function deleteAdminVehicle(id: string) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can delete vehicles' }
  }

  // Read the image URL first: once the row is gone it is unrecoverable and the
  // storage object would be orphaned.
  const { data: existing } = await supabase
    .from('vehicles')
    .select('primary_image_url')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vehicle:', error)
    return { error: error.message }
  }

  // Only after the row is gone, so a failed delete never destroys a live image.
  if (existing?.primary_image_url) {
    await removeVehicleImage(existing.primary_image_url)
  }

  revalidatePath('/admin/vehicles')
  revalidatePath('/vendor/vehicles')
  return { success: true }
}

export async function toggleAdminVehicleAvailability(id: string, isAvailable: boolean) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can update vehicle availability' }
  }

  const { error } = await supabase
    .from('vehicles')
    .update({ is_available: isAvailable })
    .eq('id', id)

  if (error) {
    console.error('Error updating vehicle availability:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicles')
  revalidatePath('/vendor/vehicles')
  return { success: true }
}

export async function bulkDeleteAdminVehicles(ids: string[]) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can delete vehicles' }
  }

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error bulk deleting vehicles:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicles')
  revalidatePath('/vendor/vehicles')
  return { success: true }
}

export async function bulkToggleAdminAvailability(ids: string[], isAvailable: boolean) {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Only admins can update vehicle availability' }
  }

  const { error } = await supabase
    .from('vehicles')
    .update({ is_available: isAvailable })
    .in('id', ids)

  if (error) {
    console.error('Error bulk updating availability:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicles')
  revalidatePath('/vendor/vehicles')
  return { success: true }
}
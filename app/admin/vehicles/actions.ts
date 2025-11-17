"use server"

import { createClient } from "@/lib/supabase/server"
import { VehicleFormData } from "@/lib/types/vehicle"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { uploadVehicleImages } from "./actions/upload"

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

export interface AdminVehicleFormData extends VehicleFormData {
  business_id: string
  primaryImageBase64?: string | null
  galleryImagesBase64?: string[]
  existingPrimaryImage?: string | null
  existingGalleryImages?: string[]
}

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
    return { error: 'Only admins can create vehicles' }
  }

  // Handle image uploads if provided
  let primaryImageUrl = formData.existingPrimaryImage || null
  let galleryImageUrls = formData.existingGalleryImages || []

  if (formData.primaryImageBase64 || (formData.galleryImagesBase64 && formData.galleryImagesBase64.length > 0)) {
    const uploadResult = await uploadVehicleImages(
      formData.business_id,
      formData.primaryImageBase64,
      formData.galleryImagesBase64
    )

    if (uploadResult.error) {
      return { error: uploadResult.error }
    }

    if (uploadResult.primaryImageUrl) {
      primaryImageUrl = uploadResult.primaryImageUrl
    }

    if (uploadResult.galleryImageUrls.length > 0) {
      galleryImageUrls = [...galleryImageUrls, ...uploadResult.galleryImageUrls]
    }
  }

  // Create vehicle
  const vehicleData = {
    business_id: formData.business_id,
    make: formData.make,
    model: formData.model,
    year: formData.year,
    registration_number: formData.registration_number,
    category_id: formData.category_id || null,
    vehicle_type_id: formData.vehicle_type_id,
    fuel_type: formData.fuel_type || null,
    transmission: formData.transmission || null,
    seats: formData.seats || null,
    luggage_capacity: formData.luggage_capacity || 2,
    is_available: formData.is_available,
    primary_image_url: primaryImageUrl,
    gallery_images: galleryImageUrls,
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicleData])
    .select()
    .single()

  if (error) {
    console.error('Error creating vehicle:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicles')
  revalidatePath('/vendor/vehicles')
  return { data }
}

export async function updateAdminVehicle(id: string, formData: AdminVehicleFormData) {
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
    return { error: 'Only admins can update vehicles' }
  }

  // Handle image uploads if provided
  let primaryImageUrl = formData.existingPrimaryImage || null
  let galleryImageUrls = formData.existingGalleryImages || []

  if (formData.primaryImageBase64 || (formData.galleryImagesBase64 && formData.galleryImagesBase64.length > 0)) {
    const uploadResult = await uploadVehicleImages(
      formData.business_id,
      formData.primaryImageBase64,
      formData.galleryImagesBase64
    )

    if (uploadResult.error) {
      return { error: uploadResult.error }
    }

    if (uploadResult.primaryImageUrl) {
      primaryImageUrl = uploadResult.primaryImageUrl
    }

    if (uploadResult.galleryImageUrls.length > 0) {
      galleryImageUrls = [...galleryImageUrls, ...uploadResult.galleryImageUrls]
    }
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update({
      business_id: formData.business_id,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      registration_number: formData.registration_number,
      category_id: formData.category_id || null,
      vehicle_type_id: formData.vehicle_type_id,
      fuel_type: formData.fuel_type || null,
      transmission: formData.transmission || null,
      seats: formData.seats || null,
      luggage_capacity: formData.luggage_capacity || 2,
      is_available: formData.is_available,
      primary_image_url: primaryImageUrl,
      gallery_images: galleryImageUrls,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating vehicle:', error)
    return { error: error.message }
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

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vehicle:', error)
    return { error: error.message }
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
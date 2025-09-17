"use server"

import { createClient } from "@/lib/supabase/server"
import { Vehicle, VehicleFormData, VehicleFilters } from "@/lib/types/vehicle"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { revalidatePath } from "next/cache"

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

export async function createVehicle(businessId: string, data: VehicleFormData & {
  primaryImageBase64?: string | null
  galleryImagesBase64?: string[]
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // First create the vehicle record
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        business_id: businessId,
        make: data.make,
        model: data.model,
        year: data.year,
        registration_number: data.registration_number,
        category_id: data.category_id,
        vehicle_type_id: data.vehicle_type_id,
        fuel_type: data.fuel_type || null,
        transmission: data.transmission || null,
        seats: data.seats || null,
        luggage_capacity: data.luggage_capacity || 2,
        is_available: data.is_available,
      })
      .select()
      .single()

    if (vehicleError) {
      console.error('Error creating vehicle:', vehicleError)
      return { error: vehicleError.message }
    }

    // Upload images if provided
    let primaryImageUrl = null
    let galleryImageUrls = []

    if (data.primaryImageBase64 || data.galleryImagesBase64?.length) {
      const vehicleId = vehicle.id
      const folderPath = `vehicles/${businessId}/${vehicleId}`

      // Upload primary image
      if (data.primaryImageBase64) {
        const matches = data.primaryImageBase64.match(/^data:(.+);base64,(.+)$/)
        if (matches) {
          const mimeType = matches[1]
          const base64Data = matches[2]
          const fileExt = mimeType.split('/')[1] || 'jpg'
          const buffer = Buffer.from(base64Data, 'base64')
          const primaryImagePath = `${folderPath}/primary-${Date.now()}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from('vehicles')
            .upload(primaryImagePath, buffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: mimeType
            })

          if (uploadError) {
            console.error('Error uploading primary image:', uploadError)
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('vehicles')
              .getPublicUrl(primaryImagePath)
            primaryImageUrl = publicUrl
          }
        }
      }

      // Upload gallery images
      if (data.galleryImagesBase64?.length > 0) {
        for (let i = 0; i < data.galleryImagesBase64.length; i++) {
          const base64 = data.galleryImagesBase64[i]
          const matches = base64.match(/^data:(.+);base64,(.+)$/)
          if (matches) {
            const mimeType = matches[1]
            const base64Data = matches[2]
            const fileExt = mimeType.split('/')[1] || 'jpg'
            const buffer = Buffer.from(base64Data, 'base64')
            const galleryImagePath = `${folderPath}/gallery-${i}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
              .from('vehicles')
              .upload(galleryImagePath, buffer, {
                cacheControl: '3600',
                upsert: false,
                contentType: mimeType
              })

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('vehicles')
                .getPublicUrl(galleryImagePath)
              galleryImageUrls.push(publicUrl)
            }
          }
        }
      }

      // Update vehicle with image URLs
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          primary_image_url: primaryImageUrl,
          gallery_images: galleryImageUrls
        })
        .eq('id', vehicleId)

      if (updateError) {
        console.error('Error updating vehicle with images:', updateError)
      }
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
  data: VehicleFormData & {
    primaryImageBase64?: string | null
    galleryImagesBase64?: string[]
    existingPrimaryImage?: string | null
    existingGalleryImages?: string[]
  }
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Update basic vehicle data
    const { error } = await supabase
      .from('vehicles')
      .update({
        make: data.make,
        model: data.model,
        year: data.year,
        registration_number: data.registration_number,
        category_id: data.category_id,
        vehicle_type_id: data.vehicle_type_id,
        fuel_type: data.fuel_type || null,
        transmission: data.transmission || null,
        seats: data.seats || null,
        luggage_capacity: data.luggage_capacity || 2,
        is_available: data.is_available,
      })
      .eq('id', vehicleId)
      .eq('business_id', businessId)

    if (error) {
      console.error('Error updating vehicle:', error)
      return { error: error.message }
    }

    // Handle image updates
    let primaryImageUrl = data.existingPrimaryImage
    let galleryImageUrls = [...(data.existingGalleryImages || [])]

    const folderPath = `vehicles/${businessId}/${vehicleId}`

    // Upload new primary image if provided
    if (data.primaryImageBase64) {
      // Delete old primary image if it exists
      if (primaryImageUrl) {
        const oldPath = primaryImageUrl.split('/').slice(-4).join('/')
        await supabase.storage
          .from('vehicles')
          .remove([oldPath])
      }

      const matches = data.primaryImageBase64.match(/^data:(.+);base64,(.+)$/)
      if (matches) {
        const mimeType = matches[1]
        const base64Data = matches[2]
        const fileExt = mimeType.split('/')[1] || 'jpg'
        const buffer = Buffer.from(base64Data, 'base64')
        const primaryImagePath = `${folderPath}/primary-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('vehicles')
          .upload(primaryImagePath, buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: mimeType
          })

        if (uploadError) {
          console.error('Error uploading primary image:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('vehicles')
            .getPublicUrl(primaryImagePath)
          primaryImageUrl = publicUrl
        }
      }
    }

    // Upload new gallery images if provided
    if (data.galleryImagesBase64?.length > 0) {
      const newGalleryUrls = []

      for (let i = 0; i < data.galleryImagesBase64.length; i++) {
        const base64 = data.galleryImagesBase64[i]
        const matches = base64.match(/^data:(.+);base64,(.+)$/)
        if (matches) {
          const mimeType = matches[1]
          const base64Data = matches[2]
          const fileExt = mimeType.split('/')[1] || 'jpg'
          const buffer = Buffer.from(base64Data, 'base64')
          const galleryImagePath = `${folderPath}/gallery-${galleryImageUrls.length + i}-${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('vehicles')
            .upload(galleryImagePath, buffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: mimeType
            })

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('vehicles')
              .getPublicUrl(galleryImagePath)
            newGalleryUrls.push(publicUrl)
          }
        }
      }

      galleryImageUrls = [...galleryImageUrls, ...newGalleryUrls]
    }

    // Update vehicle with new image URLs
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        primary_image_url: primaryImageUrl,
        gallery_images: galleryImageUrls
      })
      .eq('id', vehicleId)

    if (updateError) {
      console.error('Error updating vehicle images:', updateError)
    }

    // Handle feature mappings
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
"use server"

import { createClient } from "@/lib/supabase/server"
import { VehicleFormData } from "@/lib/types/business"
import { revalidatePath } from "next/cache"

export async function toggleVehicleAvailability(
  vehicleId: string,
  businessId: string,
  isAvailable: boolean
) {
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

export async function deleteVehicle(vehicleId: string, businessId: string) {
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

export async function createVehicle(businessId: string, data: VehicleFormData) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('vehicles')
      .insert({
        business_id: businessId,
        make: data.make,
        model: data.model,
        year: data.year,
        registration_number: data.registration_number,
        daily_rate: data.daily_rate,
        fuel_type: data.fuel_type || null,
        transmission: data.transmission || null,
        seats: data.seats || null,
        features: data.features || [],
        is_available: data.is_available,
      })

    if (error) {
      console.error('Error creating vehicle:', error)
      return { error: error.message }
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
  data: VehicleFormData
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('vehicles')
      .update({
        make: data.make,
        model: data.model,
        year: data.year,
        registration_number: data.registration_number,
        daily_rate: data.daily_rate,
        fuel_type: data.fuel_type || null,
        transmission: data.transmission || null,
        seats: data.seats || null,
        features: data.features || [],
        is_available: data.is_available,
      })
      .eq('id', vehicleId)
      .eq('business_id', businessId)

    if (error) {
      console.error('Error updating vehicle:', error)
      return { error: error.message }
    }

    revalidatePath('/vendor/vehicles')
    revalidatePath(`/vendor/vehicles/${vehicleId}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
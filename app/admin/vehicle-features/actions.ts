"use server"

import { createClient } from "@/lib/supabase/server"
import { VehicleFeatureFormData, VehicleFeatureFilters } from "@/lib/types/vehicle-feature"
import { revalidatePath } from "next/cache"

export async function getVehicleFeatures(filters: VehicleFeatureFilters = {}) {
  const supabase = await createClient()
  
  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('vehicle_features')
    .select('*', { count: 'exact' })
    .order('sort_order')
    .order('name')
    .range(from, to)

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.is_active !== undefined && filters.is_active !== 'all') {
    query = query.eq('is_active', filters.is_active)
  }

  const { data: features, error, count } = await query

  if (error) {
    console.error('Error fetching vehicle features:', error)
    return { features: [], total: 0, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    features: features || [],
    total,
    totalPages
  }
}

export async function getVehicleFeature(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vehicle_features')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching vehicle feature:', error)
    return null
  }

  return data
}

export async function createVehicleFeature(data: VehicleFeatureFormData) {
  const supabase = await createClient()

  try {
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
      return { error: 'Only admins can create vehicle features' }
    }

    // Create the feature
    const { error } = await supabase
      .from('vehicle_features')
      .insert({
        name: data.name,
        slug: data.slug,
        icon: data.icon || null,
        category: data.category || null,
        description: data.description || null,
        sort_order: data.sort_order || 0,
        is_active: data.is_active,
      })

    if (error) {
      console.error('Error creating vehicle feature:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/vehicle-features')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateVehicleFeature(id: string, data: VehicleFeatureFormData) {
  const supabase = await createClient()

  try {
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
      return { error: 'Only admins can update vehicle features' }
    }

    // Update the feature
    const { error } = await supabase
      .from('vehicle_features')
      .update({
        name: data.name,
        slug: data.slug,
        icon: data.icon || null,
        category: data.category || null,
        description: data.description || null,
        sort_order: data.sort_order || 0,
        is_active: data.is_active,
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating vehicle feature:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/vehicle-features')
    revalidatePath(`/admin/vehicle-features/${id}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function deleteVehicleFeature(id: string) {
  const supabase = await createClient()

  try {
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
      return { error: 'Only admins can delete vehicle features' }
    }

    // Check if feature is in use
    const { count } = await supabase
      .from('vehicle_feature_mappings')
      .select('*', { count: 'exact', head: true })
      .eq('feature_id', id)

    if (count && count > 0) {
      return { error: `This feature is used by ${count} vehicles and cannot be deleted` }
    }

    // Delete the feature
    const { error } = await supabase
      .from('vehicle_features')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting vehicle feature:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/vehicle-features')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function toggleFeatureStatus(id: string, isActive: boolean) {
  const supabase = await createClient()

  try {
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
      return { error: 'Only admins can toggle feature status' }
    }

    const { error } = await supabase
      .from('vehicle_features')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) {
      console.error('Error toggling feature status:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/vehicle-features')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

// Get only active features (useful for vehicle forms)
export async function getActiveVehicleFeatures() {
  const supabase = await createClient()
  
  const { data: features, error } = await supabase
    .from('vehicle_features')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')

  if (error) {
    console.error('Error fetching active vehicle features:', error)
    return []
  }

  return features || []
}
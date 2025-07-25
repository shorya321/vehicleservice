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

// Get only active features for vendors to select for their vehicles
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
"use server"

import { createClient } from "@/lib/supabase/server"
import { LocationTypeRecord } from "@/lib/types/location-type"

export async function getLocationTypes(): Promise<LocationTypeRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('location_types')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching location types:', error)
    return []
  }

  return (data ?? []) as LocationTypeRecord[]
}

export async function getActiveLocationTypes(): Promise<LocationTypeRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('location_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching active location types:', error)
    return []
  }

  return (data ?? []) as LocationTypeRecord[]
}

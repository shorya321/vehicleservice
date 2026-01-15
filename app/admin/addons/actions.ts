'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

export interface Addon {
  id: string
  name: string
  description: string | null
  icon: string
  price: number
  pricing_type: 'fixed' | 'per_unit'
  max_quantity: number
  is_active: boolean
  category: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface AddonFilters {
  search?: string
  category?: string | 'all'
  isActive?: boolean | 'all'
  page?: number
  limit?: number
}

export interface PaginatedAddons {
  addons: Addon[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getAddons(filters: AddonFilters = {}): Promise<PaginatedAddons> {
  await requireAdmin()
  const supabase = await createClient()

  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('addons')
    .select('*', { count: 'exact' })

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.isActive !== undefined && filters.isActive !== 'all') {
    query = query.eq('is_active', filters.isActive)
  }

  // Add sorting and pagination
  query = query
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  return {
    addons: (data || []) as Addon[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }
}

export async function getAddon(id: string): Promise<Addon | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('addons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching addon:', error)
    return null
  }

  return data as Addon
}

export interface AddonFormData {
  name: string
  description?: string
  icon: string
  price: number
  pricing_type: 'fixed' | 'per_unit'
  max_quantity: number
  category: string
  display_order?: number
  is_active: boolean
}

export async function createAddon(data: AddonFormData) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('addons')
    .insert({
      name: data.name,
      description: data.description || null,
      icon: data.icon,
      price: data.price,
      pricing_type: data.pricing_type,
      max_quantity: data.max_quantity,
      category: data.category,
      display_order: data.display_order || 0,
      is_active: data.is_active
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/addons')
}

export async function updateAddon(id: string, data: AddonFormData) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('addons')
    .update({
      name: data.name,
      description: data.description || null,
      icon: data.icon,
      price: data.price,
      pricing_type: data.pricing_type,
      max_quantity: data.max_quantity,
      category: data.category,
      display_order: data.display_order || 0,
      is_active: data.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/addons')
  revalidatePath(`/admin/addons/${id}/edit`)
}

export async function deleteAddon(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Check if any business bookings are using this addon
  const { count: businessCount } = await supabase
    .from('business_booking_addons')
    .select('*', { count: 'exact', head: true })
    .eq('addon_id', id)

  if (businessCount && businessCount > 0) {
    throw new Error(`Cannot delete addon. ${businessCount} business bookings are using this addon.`)
  }

  // Check if any customer bookings are using this addon
  const { count: customerCount } = await supabase
    .from('booking_amenities')
    .select('*', { count: 'exact', head: true })
    .eq('addon_id', id)

  if (customerCount && customerCount > 0) {
    throw new Error(`Cannot delete addon. ${customerCount} customer bookings are using this addon.`)
  }

  const { error } = await supabase
    .from('addons')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/addons')
}

export async function toggleAddonStatus(id: string, isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('addons')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/addons')
}

// Get all active addons for booking forms
export async function getActiveAddons() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('addons')
    .select('id, name, description, icon, price, pricing_type, max_quantity, category')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Get unique categories for filters
export async function getAddonCategories() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('addons')
    .select('category')
    .order('category')

  if (error) {
    throw new Error(error.message)
  }

  // Get unique categories
  const categories = Array.from(new Set(data?.map(d => d.category) || []))
  return categories
}

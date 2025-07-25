"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { uploadCategoryImage } from "./actions/upload"

export interface CategoryFilters {
  search?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'sort_order' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface CategoryFormData {
  name: string
  slug?: string
  description?: string
  sort_order?: number
  imageBase64?: string | null
  existingImage?: string | null
}

export async function getCategories(filters: CategoryFilters = {}) {
  const supabase = await createClient()
  
  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sortBy = filters.sortBy || 'sort_order'
  const sortOrder = filters.sortOrder || 'asc'

  let query = supabase
    .from('vehicle_categories')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  // Search filter
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data: categories, error, count } = await query

  if (error) {
    console.error('Error fetching vehicle categories:', error)
    return { categories: [], total: 0, page, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / limit)

  return {
    categories: categories || [],
    total,
    page,
    totalPages,
  }
}

export async function getCategory(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vehicle_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return { error: error.message }
  }

  return { data }
}

export async function createCategory(formData: CategoryFormData) {
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
    return { error: 'Only admins can create vehicle categories' }
  }

  // Generate slug from name if not provided
  const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  // Handle image upload if provided
  let imageUrl = null
  if (formData.imageBase64) {
    const uploadResult = await uploadCategoryImage(slug, formData.imageBase64)
    if (uploadResult.error) {
      return { error: uploadResult.error }
    }
    imageUrl = uploadResult.imageUrl
  }
  
  // Create category
  const categoryData = {
    name: formData.name,
    slug: slug,
    description: formData.description || null,
    sort_order: formData.sort_order || 999,
    image_url: imageUrl,
  }

  const { data, error } = await supabase
    .from('vehicle_categories')
    .insert([categoryData])
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicle-categories')
  return { data }
}

export async function updateCategory(id: string, formData: CategoryFormData) {
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
    return { error: 'Only admins can update vehicle categories' }
  }

  // Generate slug from name if not provided
  const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  
  // Handle image upload if provided
  let imageUrl = formData.existingImage || null
  if (formData.imageBase64) {
    const uploadResult = await uploadCategoryImage(slug, formData.imageBase64)
    if (uploadResult.error) {
      return { error: uploadResult.error }
    }
    imageUrl = uploadResult.imageUrl
  }
  
  const { data, error } = await supabase
    .from('vehicle_categories')
    .update({
      name: formData.name,
      slug: slug,
      description: formData.description || null,
      sort_order: formData.sort_order || 999,
      image_url: imageUrl,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicle-categories')
  revalidatePath(`/admin/vehicle-categories/${id}/edit`)
  return { data }
}

export async function deleteCategory(id: string) {
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
    return { error: 'Only admins can delete vehicle categories' }
  }

  // Check if category is in use
  const { count } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    return { error: `Cannot delete category. ${count} vehicles are using this category.` }
  }

  const { error } = await supabase
    .from('vehicle_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicle-categories')
  return { success: true }
}

export async function bulkDeleteCategories(ids: string[]) {
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
    return { error: 'Only admins can delete vehicle categories' }
  }

  // Check if any categories are in use
  const { data: vehiclesUsingCategories } = await supabase
    .from('vehicles')
    .select('category_id')
    .in('category_id', ids)

  if (vehiclesUsingCategories && vehiclesUsingCategories.length > 0) {
    const usedCategories = [...new Set(vehiclesUsingCategories.map(v => v.category_id))]
    return { error: `Cannot delete categories. Some categories are being used by vehicles.` }
  }

  const { error } = await supabase
    .from('vehicle_categories')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error bulk deleting categories:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/vehicle-categories')
  return { success: true }
}

export async function getCategoryUsageCount(id: string) {
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (error) {
    console.error('Error getting category usage count:', error)
    return 0
  }

  return count || 0
}
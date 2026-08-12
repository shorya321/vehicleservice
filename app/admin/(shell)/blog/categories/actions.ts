'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath, revalidateTag } from 'next/cache'
import { uploadBlogImage } from '../posts/actions/upload'
import { deleteAdminImageByUrl } from '@/lib/storage/admin-image'

export interface BlogCategoryFilters {
  search?: string
  isActive?: boolean | 'all'
  page?: number
  limit?: number
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  post_count?: number
}

export interface PaginatedBlogCategories {
  categories: BlogCategory[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getBlogCategories(
  filters: BlogCategoryFilters = {}
): Promise<PaginatedBlogCategories> {
  await requireAdmin()
  const supabase = await createClient()

  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('blog_categories')
    .select('*', { count: 'exact' })

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
  }

  if (filters.isActive !== undefined && filters.isActive !== 'all') {
    query = query.eq('is_active', filters.isActive)
  }

  query = query
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[Blog] Error fetching categories:', error)
    throw new Error(error.message)
  }

  return {
    categories: (data || []) as BlogCategory[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getBlogCategory(id: string): Promise<BlogCategory | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Blog] Error fetching category:', error)
    return null
  }

  return data as BlogCategory
}

export async function getAllBlogCategories() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('[Blog] Error fetching all categories:', error)
    return []
  }

  return data || []
}

export interface BlogCategoryFormData {
  name: string
  slug: string
  description?: string
  sort_order?: number
  is_active: boolean
  imageBase64?: string | null
  existingImage?: string | null
}

export async function createBlogCategory(data: BlogCategoryFormData) {
  await requireAdmin()
  const supabase = await createClient()

  let imageUrl: string | null = null
  if (data.imageBase64) {
    const uploadResult = await uploadBlogImage(`categories/${data.slug}`, data.imageBase64)
    if (uploadResult.error) throw new Error(uploadResult.error)
    imageUrl = uploadResult.imageUrl
  }

  const { error } = await supabase
    .from('blog_categories')
    .insert({
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description || null,
      image_url: imageUrl,
      sort_order: data.sort_order || null,
      is_active: data.is_active,
    })

  if (error) {
    console.error('[Blog] Error creating category:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/categories')
  revalidateTag('blog-categories')
}

export async function updateBlogCategory(id: string, data: BlogCategoryFormData) {
  await requireAdmin()
  const supabase = await createClient()

  // Read the current image before overwriting it, so the old storage object can
  // be cleaned up once the update commits. The form only sends back
  // `existingImage` when the image is unchanged, so it can't be relied on here.
  const { data: existing } = await supabase
    .from('blog_categories')
    .select('image_url')
    .eq('id', id)
    .single()

  let imageUrl = data.existingImage || null
  if (data.imageBase64) {
    const uploadResult = await uploadBlogImage(`categories/${data.slug}`, data.imageBase64)
    if (uploadResult.error) throw new Error(uploadResult.error)
    imageUrl = uploadResult.imageUrl
  }

  const { error } = await supabase
    .from('blog_categories')
    .update({
      name: data.name,
      slug: data.slug.toLowerCase(),
      description: data.description || null,
      image_url: imageUrl,
      sort_order: data.sort_order || null,
      is_active: data.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error updating category:', error)
    throw new Error(error.message)
  }

  // Only after the row commits, and only if nothing else still points at it.
  // Legacy uploads used a fixed per-slug path, so an old URL could in principle
  // be shared by a duplicated record.
  if (existing?.image_url && existing.image_url !== imageUrl) {
    const { count } = await supabase
      .from('blog_categories')
      .select('id', { count: 'exact', head: true })
      .eq('image_url', existing.image_url)

    if (count === 0) {
      await deleteAdminImageByUrl(existing.image_url, 'vehicles')
    }
  }

  revalidatePath('/admin/blog/categories')
  revalidatePath(`/admin/blog/categories/${id}/edit`)
  revalidateTag('blog-categories')
}

export async function deleteBlogCategory(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Check if posts use this category
  const { count } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    throw new Error(`Cannot delete category. ${count} blog posts use this category.`)
  }

  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error deleting category:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/categories')
  revalidateTag('blog-categories')
}

export async function toggleBlogCategoryStatus(id: string, isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('blog_categories')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error toggling category status:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/categories')
  revalidateTag('blog-categories')
}

export async function bulkDeleteBlogCategories(ids: string[]) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('blog_categories')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/categories')
  revalidateTag('blog-categories')
  return { count: ids.length }
}

export async function bulkToggleBlogCategoryStatus(ids: string[], isActive: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('blog_categories')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/categories')
  revalidateTag('blog-categories')
  return { count: ids.length }
}

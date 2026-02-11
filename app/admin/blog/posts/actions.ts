'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath, revalidateTag } from 'next/cache'
import { uploadBlogImage } from './actions/upload'

export interface BlogPostFilters {
  search?: string
  categoryId?: string | 'all'
  status?: string | 'all'
  isFeatured?: boolean | 'all'
  page?: number
  limit?: number
}

export interface BlogPostWithRelations {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image_url: string | null
  category_id: string | null
  author_id: string | null
  status: 'draft' | 'published' | 'archived' | null
  is_featured: boolean | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  published_at: string | null
  reading_time_minutes: number | null
  view_count: number | null
  created_at: string | null
  updated_at: string | null
  category: { id: string; name: string; slug: string } | null
  author: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null
  tags: { id: string; name: string; slug: string }[]
}

export interface PaginatedBlogPosts {
  posts: BlogPostWithRelations[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getBlogPosts(
  filters: BlogPostFilters = {}
): Promise<PaginatedBlogPosts> {
  await requireAdmin()
  const supabase = await createClient()

  const page = filters.page || 1
  const limit = filters.limit || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('blog_posts')
    .select(`
      *,
      category:category_id(id, name, slug),
      author:author_id(id, full_name, email, avatar_url)
    `, { count: 'exact' })

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
  }

  if (filters.categoryId && filters.categoryId !== 'all') {
    query = query.eq('category_id', filters.categoryId)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.isFeatured !== undefined && filters.isFeatured !== 'all') {
    query = query.eq('is_featured', filters.isFeatured)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[Blog] Error fetching posts:', error)
    throw new Error(error.message)
  }

  // Fetch tags for each post
  const posts = data || []
  const postIds = posts.map(p => p.id)

  let tagsMap: Record<string, { id: string; name: string; slug: string }[]> = {}
  if (postIds.length > 0) {
    const { data: postTags } = await supabase
      .from('blog_post_tags')
      .select('post_id, tag:tag_id(id, name, slug)')
      .in('post_id', postIds)

    if (postTags) {
      for (const pt of postTags) {
        if (!tagsMap[pt.post_id]) tagsMap[pt.post_id] = []
        if (pt.tag) tagsMap[pt.post_id].push(pt.tag as any)
      }
    }
  }

  const postsWithTags = posts.map(post => ({
    ...post,
    category: post.category as any,
    author: post.author as any,
    tags: tagsMap[post.id] || [],
  }))

  return {
    posts: postsWithTags,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getBlogPost(id: string): Promise<BlogPostWithRelations | null> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:category_id(id, name, slug),
      author:author_id(id, full_name, email, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Blog] Error fetching post:', error)
    return null
  }

  // Fetch tags
  const { data: postTags } = await supabase
    .from('blog_post_tags')
    .select('tag:tag_id(id, name, slug)')
    .eq('post_id', id)

  const tags = postTags?.map(pt => pt.tag as any).filter(Boolean) || []

  return {
    ...data,
    category: data.category as any,
    author: data.author as any,
    tags,
  }
}

export interface BlogPostFormData {
  title: string
  slug: string
  excerpt?: string
  content?: string
  category_id?: string
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  reading_time_minutes?: number
  tag_ids?: string[]
  imageBase64?: string | null
  existingImage?: string | null
}

function calculateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

export async function createBlogPost(data: BlogPostFormData) {
  await requireAdmin()
  const supabase = await createClient()

  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser()

  // Handle image upload
  let imageUrl: string | null = null
  if (data.imageBase64) {
    const uploadResult = await uploadBlogImage(data.slug, data.imageBase64)
    if (uploadResult.error) {
      throw new Error(uploadResult.error)
    }
    imageUrl = uploadResult.imageUrl
  }

  const readingTime = data.content ? calculateReadingTime(data.content) : 1

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      title: data.title,
      slug: data.slug.toLowerCase(),
      excerpt: data.excerpt || null,
      content: data.content || null,
      featured_image_url: imageUrl,
      category_id: data.category_id || null,
      author_id: user?.id || null,
      status: data.status,
      is_featured: data.is_featured,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      meta_keywords: data.meta_keywords || null,
      reading_time_minutes: readingTime,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[Blog] Error creating post:', error)
    throw new Error(error.message)
  }

  // Insert tags
  if (data.tag_ids && data.tag_ids.length > 0 && post) {
    const tagInserts = data.tag_ids.map(tag_id => ({
      post_id: post.id,
      tag_id,
    }))
    await supabase.from('blog_post_tags').insert(tagInserts)
  }

  revalidatePath('/admin/blog/posts')
  revalidateTag('blog-posts')
}

export async function updateBlogPost(id: string, data: BlogPostFormData) {
  await requireAdmin()
  const supabase = await createClient()

  // Handle image
  let imageUrl = data.existingImage || null
  if (data.imageBase64) {
    const uploadResult = await uploadBlogImage(data.slug, data.imageBase64)
    if (uploadResult.error) {
      throw new Error(uploadResult.error)
    }
    imageUrl = uploadResult.imageUrl
  }

  const readingTime = data.content ? calculateReadingTime(data.content) : 1

  // Get existing post to check if publishing for the first time
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('status, published_at')
    .eq('id', id)
    .single()

  const publishedAt = data.status === 'published' && existing?.status !== 'published'
    ? new Date().toISOString()
    : existing?.published_at || null

  const { error } = await supabase
    .from('blog_posts')
    .update({
      title: data.title,
      slug: data.slug.toLowerCase(),
      excerpt: data.excerpt || null,
      content: data.content || null,
      featured_image_url: imageUrl,
      category_id: data.category_id || null,
      status: data.status,
      is_featured: data.is_featured,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      meta_keywords: data.meta_keywords || null,
      reading_time_minutes: readingTime,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error updating post:', error)
    throw new Error(error.message)
  }

  // Replace tags
  await supabase.from('blog_post_tags').delete().eq('post_id', id)
  if (data.tag_ids && data.tag_ids.length > 0) {
    const tagInserts = data.tag_ids.map(tag_id => ({
      post_id: id,
      tag_id,
    }))
    await supabase.from('blog_post_tags').insert(tagInserts)
  }

  revalidatePath('/admin/blog/posts')
  revalidatePath(`/admin/blog/posts/${id}/edit`)
  revalidateTag('blog-posts')
}

export async function deleteBlogPost(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error deleting post:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/posts')
  revalidateTag('blog-posts')
}

export async function toggleBlogPostStatus(id: string, status: 'draft' | 'published' | 'archived') {
  await requireAdmin()
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error toggling post status:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/posts')
  revalidateTag('blog-posts')
}

export async function toggleBlogPostFeatured(id: string, isFeatured: boolean) {
  await requireAdmin()
  const supabase = await createClient()

  const { error } = await supabase
    .from('blog_posts')
    .update({
      is_featured: isFeatured,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error toggling featured:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/posts')
  revalidateTag('blog-posts')
}

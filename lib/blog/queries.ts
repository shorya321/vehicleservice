import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/** Strip HTML tags from content and truncate to maxLen characters at the last word boundary */
function stripHtmlAndTruncate(html: string, maxLen: number): string {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLen) return text
  const truncated = text.slice(0, maxLen)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...'
}

export interface PublicBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image_url: string | null
  status: string | null
  is_featured: boolean | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  published_at: string | null
  reading_time_minutes: number | null
  view_count: number | null
  created_at: string | null
  category: { id: string; name: string; slug: string } | null
  author: { id: string; full_name: string | null; avatar_url: string | null } | null
  tags: { id: string; name: string; slug: string }[]
}

export interface PublicBlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

const CACHE_TAGS = {
  posts: 'blog-posts',
  categories: 'blog-categories',
  tags: 'blog-tags',
}

export const getPublishedPosts = unstable_cache(
  async (options: {
    page?: number
    limit?: number
    categorySlug?: string
    tagSlug?: string
    search?: string
  } = {}): Promise<{ posts: PublicBlogPost[]; total: number; totalPages: number }> => {
    try {
      const supabase = createAdminClient()
      const page = options.page || 1
      const limit = options.limit || 9
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from('blog_posts')
        .select(`
          id, title, slug, excerpt, content, featured_image_url, status,
          is_featured, published_at, reading_time_minutes, view_count, created_at,
          category:category_id(id, name, slug),
          author:author_id(id, full_name, avatar_url)
        `, { count: 'exact' })
        .eq('status', 'published')

      if (options.categorySlug) {
        const { data: cat } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', options.categorySlug)
          .eq('is_active', true)
          .single()

        if (cat) {
          query = query.eq('category_id', cat.id)
        } else {
          return { posts: [], total: 0, totalPages: 0 }
        }
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,excerpt.ilike.%${options.search}%`)
      }

      query = query
        .order('published_at', { ascending: false })
        .range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('[Blog] Error fetching published posts:', error)
        return { posts: [], total: 0, totalPages: 0 }
      }

      let posts = (data || []) as any[]

      // If filtering by tag, we need a secondary query
      if (options.tagSlug) {
        const { data: tag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('slug', options.tagSlug)
          .single()

        if (tag) {
          const { data: taggedPostIds } = await supabase
            .from('blog_post_tags')
            .select('post_id')
            .eq('tag_id', tag.id)

          if (taggedPostIds) {
            const ids = taggedPostIds.map(t => t.post_id)
            posts = posts.filter(p => ids.includes(p.id))
          }
        } else {
          return { posts: [], total: 0, totalPages: 0 }
        }
      }

      // Fetch tags for posts
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

      const postsWithTags: PublicBlogPost[] = posts.map(post => ({
        ...post,
        content: post.content ? stripHtmlAndTruncate(post.content, 160) : null,
        category: post.category as any,
        author: post.author as any,
        tags: tagsMap[post.id] || [],
      }))

      return {
        posts: postsWithTags,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    } catch (error) {
      console.error('[Blog] Error in getPublishedPosts:', error)
      return { posts: [], total: 0, totalPages: 0 }
    }
  },
  ['published-blog-posts'],
  { revalidate: 300, tags: [CACHE_TAGS.posts] }
)

export const getPublishedPost = unstable_cache(
  async (slug: string): Promise<PublicBlogPost | null> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:category_id(id, name, slug),
          author:author_id(id, full_name, avatar_url)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !data) {
        return null
      }

      // Fetch tags
      const { data: postTags } = await supabase
        .from('blog_post_tags')
        .select('tag:tag_id(id, name, slug)')
        .eq('post_id', data.id)

      const tags = postTags?.map(pt => pt.tag as any).filter(Boolean) || []

      return {
        ...data,
        category: data.category as any,
        author: data.author as any,
        tags,
      }
    } catch (error) {
      console.error('[Blog] Error in getPublishedPost:', error)
      return null
    }
  },
  ['published-blog-post'],
  { revalidate: 300, tags: [CACHE_TAGS.posts] }
)

export const getBlogCategories = unstable_cache(
  async (): Promise<PublicBlogCategory[]> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug, description, image_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('[Blog] Error fetching categories:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[Blog] Error in getBlogCategories:', error)
      return []
    }
  },
  ['blog-categories-public'],
  { revalidate: 3600, tags: [CACHE_TAGS.categories] }
)

export const getFeaturedPosts = unstable_cache(
  async (): Promise<PublicBlogPost[]> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id, title, slug, excerpt, content, featured_image_url, status,
          is_featured, published_at, reading_time_minutes, view_count, created_at,
          category:category_id(id, name, slug),
          author:author_id(id, full_name, avatar_url)
        `)
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('[Blog] Error fetching featured posts:', error)
        return []
      }

      return (data || []).map(post => ({
        ...post,
        content: post.content ? stripHtmlAndTruncate(post.content, 160) : null,
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
        category: post.category as any,
        author: post.author as any,
        tags: [],
      }))
    } catch (error) {
      console.error('[Blog] Error in getFeaturedPosts:', error)
      return []
    }
  },
  ['featured-blog-posts'],
  { revalidate: 300, tags: [CACHE_TAGS.posts] }
)

export const getPopularTags = unstable_cache(
  async (): Promise<{ id: string; name: string; slug: string; count: number }[]> => {
    try {
      const supabase = createAdminClient()

      const { data: tags } = await supabase
        .from('blog_tags')
        .select('id, name, slug')
        .order('name', { ascending: true })

      if (!tags || tags.length === 0) return []

      const { data: postTags } = await supabase
        .from('blog_post_tags')
        .select('tag_id')

      const countMap: Record<string, number> = {}
      if (postTags) {
        for (const pt of postTags) {
          countMap[pt.tag_id] = (countMap[pt.tag_id] || 0) + 1
        }
      }

      return tags
        .map(tag => ({ ...tag, count: countMap[tag.id] || 0 }))
        .filter(tag => tag.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
    } catch (error) {
      console.error('[Blog] Error in getPopularTags:', error)
      return []
    }
  },
  ['popular-blog-tags'],
  { revalidate: 3600, tags: [CACHE_TAGS.tags] }
)

export const getRelatedPosts = unstable_cache(
  async (postId: string, categoryId: string | null): Promise<PublicBlogPost[]> => {
    try {
      const supabase = createAdminClient()
      const selectFields = `
        id, title, slug, excerpt, featured_image_url, status,
        is_featured, published_at, reading_time_minutes, view_count, created_at,
        category:category_id(id, name, slug),
        author:author_id(id, full_name, avatar_url)
      `
      const mapPost = (post: any) => ({
        ...post,
        content: null,
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
        category: post.category as any,
        author: post.author as any,
        tags: [],
      })

      // 1. Try same-category posts first
      let categoryResults: any[] = []
      if (categoryId) {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(selectFields)
          .eq('status', 'published')
          .neq('id', postId)
          .eq('category_id', categoryId)
          .order('published_at', { ascending: false })
          .limit(3)

        if (!error && data) {
          categoryResults = data
        }
      }

      // 2. If fewer than 3, fill remaining slots with other published posts
      if (categoryResults.length < 3) {
        const excludeIds = [postId, ...categoryResults.map(p => p.id)]
        const { data: fillData } = await supabase
          .from('blog_posts')
          .select(selectFields)
          .eq('status', 'published')
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .order('published_at', { ascending: false })
          .limit(3 - categoryResults.length)

        if (fillData) {
          categoryResults = [...categoryResults, ...fillData]
        }
      }

      return categoryResults.map(mapPost)
    } catch (error) {
      console.error('[Blog] Error in getRelatedPosts:', error)
      return []
    }
  },
  ['related-blog-posts'],
  { revalidate: 300, tags: [CACHE_TAGS.posts] }
)

export async function incrementViewCount(postId: string) {
  try {
    const supabase = createAdminClient()

    await supabase.rpc('increment_blog_view_count' as any, { post_id: postId })
  } catch {
    // Non-critical - silently fail
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('blog_posts')
        .select('view_count')
        .eq('id', postId)
        .single()

      if (data) {
        await supabase
          .from('blog_posts')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', postId)
      }
    } catch {
      // Silently fail - view count is not critical
    }
  }
}

export const getCategoryBySlug = unstable_cache(
  async (slug: string): Promise<PublicBlogCategory | null> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug, description, image_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error || !data) return null
      return data
    } catch {
      return null
    }
  },
  ['blog-category-by-slug'],
  { revalidate: 3600, tags: [CACHE_TAGS.categories] }
)

export const getTagBySlug = unstable_cache(
  async (slug: string): Promise<{ id: string; name: string; slug: string } | null> => {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('blog_tags')
        .select('id, name, slug')
        .eq('slug', slug)
        .single()

      if (error || !data) return null
      return data
    } catch {
      return null
    }
  },
  ['blog-tag-by-slug'],
  { revalidate: 3600, tags: [CACHE_TAGS.tags] }
)

export const getAllPublishedSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const supabase = createAdminClient()

      const { data } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('status', 'published')

      return data?.map(p => p.slug) || []
    } catch {
      return []
    }
  },
  ['all-published-blog-slugs'],
  { revalidate: 3600, tags: [CACHE_TAGS.posts] }
)

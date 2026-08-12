'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/actions'
import { revalidatePath, revalidateTag } from 'next/cache'

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string | null
  post_count?: number
}

export async function getBlogTags(): Promise<BlogTag[]> {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('[Blog] Error fetching tags:', error)
    throw new Error(error.message)
  }

  // Get post counts for each tag
  const tags = data || []
  const tagIds = tags.map(t => t.id)

  if (tagIds.length > 0) {
    const { data: tagCounts } = await supabase
      .from('blog_post_tags')
      .select('tag_id')
      .in('tag_id', tagIds)

    if (tagCounts) {
      const countMap: Record<string, number> = {}
      for (const tc of tagCounts) {
        countMap[tc.tag_id] = (countMap[tc.tag_id] || 0) + 1
      }
      return tags.map(tag => ({ ...tag, post_count: countMap[tag.id] || 0 }))
    }
  }

  return tags.map(tag => ({ ...tag, post_count: 0 }))
}

export async function getAllBlogTags() {
  await requireAdmin()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_tags')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error) {
    console.error('[Blog] Error fetching all tags:', error)
    return []
  }

  return data || []
}

export async function createBlogTag(name: string) {
  await requireAdmin()
  const supabase = await createClient()

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const { error } = await supabase
    .from('blog_tags')
    .insert({ name, slug })

  if (error) {
    console.error('[Blog] Error creating tag:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/tags')
  revalidateTag('blog-tags')
}

export async function updateBlogTag(id: string, name: string) {
  await requireAdmin()
  const supabase = await createClient()

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const { error } = await supabase
    .from('blog_tags')
    .update({ name, slug })
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error updating tag:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/tags')
  revalidateTag('blog-tags')
}

export async function deleteBlogTag(id: string) {
  await requireAdmin()
  const supabase = await createClient()

  // Check post count
  const { count } = await supabase
    .from('blog_post_tags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', id)

  if (count && count > 0) {
    throw new Error(`Cannot delete tag. ${count} blog posts use this tag.`)
  }

  const { error } = await supabase
    .from('blog_tags')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Blog] Error deleting tag:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/blog/tags')
  revalidateTag('blog-tags')
}

'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { requireAdminAction } from '@/lib/auth/admin-action'
import {
  SEO_ENTITY_TYPES,
  SEO_META_TAG,
  SEO_SETTINGS_TAG,
  seoMetaSchema,
  seoSettingsSchema,
  type SeoEntityType,
} from '@/lib/seo/types'
import { CMS_IMAGE_BUCKET, removedCmsImages } from '@/lib/cms/images'
import { deleteAdminImageByUrl } from '@/lib/storage/admin-image'

interface ActionResult {
  success: boolean
  error?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function firstIssue(error: { issues: { path: (string | number)[]; message: string }[] }): string {
  const issue = error.issues[0]
  return issue.path.length > 0 ? `${issue.path.join(' > ')}: ${issue.message}` : issue.message
}

/** Public path an entity's SEO change should refresh, where one is known. */
async function publicPathFor(entityType: SeoEntityType, entityId: string): Promise<string | null> {
  if (entityType === 'page') {
    const { data } = await createAdminClient().from('pages').select('slug').eq('id', entityId).maybeSingle()
    return data?.slug ?? null
  }
  if (entityType === 'blog_post') {
    const { data } = await createAdminClient().from('blog_posts').select('slug').eq('id', entityId).maybeSingle()
    return data?.slug ? `/blog/${data.slug}` : null
  }
  return null
}

/**
 * A blog post's meta fields used to live on its own row, and the public page
 * still falls back to them. The SEO tab is seeded from them, so once it saves,
 * the seo_meta row holds every value and the old columns are cleared. Without
 * this, emptying a field in the tab would bring the old value back.
 */
async function clearLegacyBlogMeta(entityId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from('blog_posts')
    .update({ meta_title: null, meta_description: null, meta_keywords: null })
    .eq('id', entityId)
  if (error) {
    console.error('[seo] Failed to clear legacy blog meta:', error.message)
  }
}

/** Saves one entity's SEO overrides. Empty fields fall back to the defaults. */
export async function updateSeoMeta(
  entityType: SeoEntityType,
  entityId: string,
  values: unknown
): Promise<ActionResult> {
  try {
    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }
    if (!SEO_ENTITY_TYPES.includes(entityType) || !UUID_PATTERN.test(entityId)) {
      return { success: false, error: 'Unknown page' }
    }

    const parsed = seoMetaSchema.safeParse(values)
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) }
    }

    const v = parsed.data
    const admin = createAdminClient()
    const { data: previous } = await admin
      .from('seo_meta')
      .select('og_image_url')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .maybeSingle()

    const { error } = await admin
      .from('seo_meta')
      .upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          meta_title: v.meta_title || null,
          meta_description: v.meta_description || null,
          meta_keywords: v.meta_keywords || null,
          og_title: v.og_title || null,
          og_description: v.og_description || null,
          og_image_url: v.og_image_url || null,
          canonical_path: v.canonical_path || null,
          noindex: v.noindex,
          nofollow: v.nofollow,
          updated_by: auth.userId,
        },
        { onConflict: 'entity_type,entity_id' }
      )

    if (error) {
      console.error('[seo] Failed to save seo meta:', error.message)
      return { success: false, error: 'Could not save SEO settings. Try again.' }
    }

    await Promise.all(
      removedCmsImages(previous?.og_image_url, v.og_image_url).map((url) =>
        deleteAdminImageByUrl(url, CMS_IMAGE_BUCKET)
      )
    )
    if (entityType === 'blog_post') {
      await clearLegacyBlogMeta(entityId)
    }

    updateTag(`${SEO_META_TAG}:${entityType}:${entityId}`)
    const path = await publicPathFor(entityType, entityId)
    if (path) {
      revalidatePath(path)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('[seo] Unexpected error saving seo meta:', error)
    return { success: false, error: 'Could not save SEO settings. Try again.' }
  }
}

/** Saves the site-wide SEO defaults. */
export async function updateSeoSettings(values: unknown): Promise<ActionResult> {
  try {
    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const parsed = seoSettingsSchema.safeParse(values)
    if (!parsed.success) {
      return { success: false, error: firstIssue(parsed.error) }
    }

    const admin = createAdminClient()
    const { data: existing } = await admin.from('seo_settings').select('id').limit(1).maybeSingle()
    const config = parsed.data as unknown as Json

    const { error } = existing
      ? await admin.from('seo_settings').update({ config, updated_by: auth.userId }).eq('id', existing.id)
      : await admin.from('seo_settings').insert({ config, updated_by: auth.userId })

    if (error) {
      console.error('[seo] Failed to save seo settings:', error.message)
      return { success: false, error: 'Could not save SEO settings. Try again.' }
    }

    updateTag(SEO_SETTINGS_TAG)
    // Every page's title suffix and fallbacks come from here.
    revalidatePath('/', 'layout')

    return { success: true }
  } catch (error: unknown) {
    console.error('[seo] Unexpected error saving seo settings:', error)
    return { success: false, error: 'Could not save SEO settings. Try again.' }
  }
}

'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { requireAdminAction } from '@/lib/auth/admin-action'
import type { ZodTypeAny } from 'zod'
import { homeContentSchema } from '@/lib/cms/templates/home/schema'
import { contactContentSchema } from '@/lib/cms/templates/contact/schema'
import { legalContentSchema } from '@/lib/cms/templates/legal/schema'
import { PAGES_TAG, pageTag } from '@/lib/cms/types'
import { CMS_IMAGE_BUCKET, CMS_IMAGE_FOLDER, removedCmsImages } from '@/lib/cms/images'
import { deleteAdminImageByUrl } from '@/lib/storage/admin-image'
import { VEHICLE_IMAGE_EXTENSIONS } from '@/lib/vehicles/bucket'

interface ActionResult {
  success: boolean
  error?: string
}

/** The schema each template's content is saved against. */
const CONTENT_SCHEMAS: Readonly<Record<string, ZodTypeAny>> = {
  home: homeContentSchema,
  contact: contactContentSchema,
  terms: legalContentSchema,
  privacy: legalContentSchema,
  'vendor-agreement': legalContentSchema,
}

/**
 * Saves a page's content, validated against the schema of the template the
 * stored row says it uses (never one the browser names). Live on save.
 */
export async function updatePageContent(pageId: string, content: unknown): Promise<ActionResult> {
  try {
    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const admin = createAdminClient()
    const { data: existing, error: readError } = await admin
      .from('pages')
      .select('slug, template, content')
      .eq('id', pageId)
      .single()

    if (readError || !existing) {
      return { success: false, error: 'Page not found' }
    }

    const schema = CONTENT_SCHEMAS[existing.template]
    if (!schema) {
      return { success: false, error: 'This page has no content editor yet' }
    }

    const parsed = schema.safeParse(content)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { success: false, error: `${issue.path.join(' > ')}: ${issue.message}` }
    }

    const { error } = await admin
      .from('pages')
      .update({ content: parsed.data as Json, updated_by: auth.userId })
      .eq('id', pageId)

    if (error) {
      console.error('[cms] Failed to save page content:', error.message)
      return { success: false, error: 'Could not save the page. Try again.' }
    }

    // After the row is committed: a failed delete only leaves an orphan file.
    await Promise.all(
      removedCmsImages(existing.content, parsed.data).map((url) => deleteAdminImageByUrl(url, CMS_IMAGE_BUCKET))
    )

    updateTag(pageTag(existing.slug))
    updateTag(PAGES_TAG)
    revalidatePath(existing.slug)
    revalidatePath(`/admin/content/pages/${pageId}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('[cms] Unexpected error saving page content:', error)
    return { success: false, error: 'Could not save the page. Try again.' }
  }
}

/**
 * Takes a draft page live. One way: only a draft row matches, so a second click
 * or a stale tab cannot touch a page that is already published.
 */
export async function publishPage(pageId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const { data, error } = await createAdminClient()
      .from('pages')
      .update({ status: 'published', published_at: new Date().toISOString(), updated_by: auth.userId })
      .eq('id', pageId)
      .eq('status', 'draft')
      .select('slug')
      .maybeSingle()

    if (error) {
      console.error('[cms] Failed to publish page:', error.message)
      return { success: false, error: 'Could not publish the page. Try again.' }
    }
    if (!data) {
      return { success: false, error: 'This page is already published' }
    }

    updateTag(pageTag(data.slug))
    updateTag(PAGES_TAG)
    revalidatePath(data.slug)
    revalidatePath('/become-vendor')
    revalidatePath('/admin/content/pages')
    revalidatePath(`/admin/content/pages/${pageId}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('[cms] Unexpected error publishing page:', error)
    return { success: false, error: 'Could not publish the page. Try again.' }
  }
}

/**
 * Signs a one-time upload for a page image. The server picks the path, so the
 * browser can only write a fresh file under the CMS folder.
 */
export async function signCmsImageUpload(
  mimeType: string
): Promise<{ path: string | null; token: string | null; error: string | null }> {
  try {
    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { path: null, token: null, error: auth.error }
    }

    const extension = VEHICLE_IMAGE_EXTENSIONS[mimeType]
    if (!extension) {
      return { path: null, token: null, error: 'Use a JPG, PNG or WebP image.' }
    }

    const path = `${CMS_IMAGE_FOLDER}/${crypto.randomUUID()}.${extension}`
    const { data, error } = await createAdminClient().storage.from(CMS_IMAGE_BUCKET).createSignedUploadUrl(path)

    if (error || !data) {
      console.error('[cms] Failed to sign upload:', error?.message)
      return { path: null, token: null, error: 'Could not start the upload.' }
    }

    return { path: data.path, token: data.token, error: null }
  } catch (error: unknown) {
    console.error('[cms] Unexpected error signing upload:', error)
    return { path: null, token: null, error: 'Could not start the upload.' }
  }
}

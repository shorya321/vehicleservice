'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { requireAdminAction } from '@/lib/auth/admin-action'
import type { ZodTypeAny } from 'zod'
import { homeContentSchema } from '@/lib/cms/templates/home/schema'
import { contactContentSchema } from '@/lib/cms/templates/contact/schema'
import { legalContentSchema } from '@/lib/cms/templates/legal/schema'
import { PAGES_TAG, canChangePageStatus, pageTag, type PageKind, type PageStatus, type PageTemplate } from '@/lib/cms/types'
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
 * Publishes or unpublishes a page. Only pages where a draft really hides the
 * page qualify (see `canChangePageStatus`), checked against the stored row
 * rather than anything the browser sends. Matching on the current status makes
 * a double click or a stale tab a no-op instead of a second write.
 */
export async function setPageStatus(pageId: string, status: PageStatus): Promise<ActionResult> {
  try {
    if (status !== 'published' && status !== 'draft') {
      return { success: false, error: 'Unknown status' }
    }

    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const admin = createAdminClient()
    const { data: existing, error: readError } = await admin
      .from('pages')
      .select('slug, kind, template, status')
      .eq('id', pageId)
      .single()

    if (readError || !existing) {
      return { success: false, error: 'Page not found' }
    }
    if (!canChangePageStatus({ kind: existing.kind as PageKind, template: existing.template as PageTemplate })) {
      return { success: false, error: 'This page is always live' }
    }
    if (existing.status === status) {
      return { success: false, error: status === 'published' ? 'This page is already published' : 'This page is already a draft' }
    }

    const { error } = await admin
      .from('pages')
      .update({
        status,
        ...(status === 'published' ? { published_at: new Date().toISOString() } : {}),
        updated_by: auth.userId,
      })
      .eq('id', pageId)
      .eq('status', existing.status)

    if (error) {
      console.error('[cms] Failed to change page status:', error.message)
      return { success: false, error: 'Could not update the page. Try again.' }
    }

    updateTag(pageTag(existing.slug))
    updateTag(PAGES_TAG)
    revalidatePath(existing.slug)
    // Its consent line links the agreement only while it is published.
    revalidatePath('/become-vendor')
    revalidatePath('/admin/content/pages')
    revalidatePath(`/admin/content/pages/${pageId}`)

    return { success: true }
  } catch (error: unknown) {
    console.error('[cms] Unexpected error changing page status:', error)
    return { success: false, error: 'Could not update the page. Try again.' }
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

'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { requireAdminAction } from '@/lib/auth/admin-action'
import { homeContentSchema } from '@/lib/cms/templates/home/schema'
import { PAGES_TAG, pageTag } from '@/lib/cms/types'
import { CMS_IMAGE_BUCKET, CMS_IMAGE_FOLDER, removedCmsImages } from '@/lib/cms/images'
import { deleteAdminImageByUrl } from '@/lib/storage/admin-image'
import { VEHICLE_IMAGE_EXTENSIONS } from '@/lib/vehicles/bucket'

interface ActionResult {
  success: boolean
  error?: string
}

/** Saves the home page's content. The page goes live on save. */
export async function updateHomeContent(pageId: string, content: unknown): Promise<ActionResult> {
  try {
    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const parsed = homeContentSchema.safeParse(content)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { success: false, error: `${issue.path.join(' > ')}: ${issue.message}` }
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
    if (existing.template !== 'home') {
      return { success: false, error: 'This page does not use the home template' }
    }

    const { error } = await admin
      .from('pages')
      .update({ content: parsed.data as unknown as Json, updated_by: auth.userId })
      .eq('id', pageId)

    if (error) {
      console.error('[cms] Failed to save home content:', error.message)
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
    console.error('[cms] Unexpected error saving home content:', error)
    return { success: false, error: 'Could not save the page. Try again.' }
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

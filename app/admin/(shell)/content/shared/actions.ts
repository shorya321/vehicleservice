'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/lib/supabase/types'
import { requireAdminAction } from '@/lib/auth/admin-action'
import { closingPanelSchema } from '@/lib/cms/blocks/closing-panel/schema'
import { CLOSING_PANEL_PATHS, CMS_BLOCKS_TAG, blockTag } from '@/lib/cms/blocks/types'
import { CMS_IMAGE_BUCKET, removedCmsImages } from '@/lib/cms/images'
import { deleteAdminImageByUrl } from '@/lib/storage/admin-image'

/**
 * Saves the shared closing panel shown on Blog, About and FAQ. Validated on
 * the server whatever the browser sent; live on save.
 */
export async function updateClosingPanel(content: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireAdminAction()
    if ('error' in auth) {
      return { success: false, error: auth.error }
    }

    const parsed = closingPanelSchema.safeParse(content)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { success: false, error: `${issue.path.join(' > ')}: ${issue.message}` }
    }

    const admin = createAdminClient()
    const { data: existing, error: readError } = await admin
      .from('cms_blocks')
      .select('content')
      .eq('key', 'closing-panel')
      .maybeSingle()

    if (readError) {
      console.error('[cms] Failed to read closing panel:', readError.message)
      return { success: false, error: 'Could not save the section. Try again.' }
    }

    const { error } = await admin
      .from('cms_blocks')
      .upsert({ key: 'closing-panel', content: parsed.data as Json, updated_by: auth.userId })

    if (error) {
      console.error('[cms] Failed to save closing panel:', error.message)
      return { success: false, error: 'Could not save the section. Try again.' }
    }

    // After the row is committed: a failed delete only leaves an orphan file.
    await Promise.all(
      removedCmsImages(existing?.content ?? null, parsed.data).map((url) => deleteAdminImageByUrl(url, CMS_IMAGE_BUCKET))
    )

    updateTag(blockTag('closing-panel'))
    updateTag(CMS_BLOCKS_TAG)
    for (const path of CLOSING_PANEL_PATHS) {
      revalidatePath(path, 'layout')
    }
    revalidatePath('/admin/content/shared/closing-panel')

    return { success: true }
  } catch (error: unknown) {
    console.error('[cms] Unexpected error saving closing panel:', error)
    return { success: false, error: 'Could not save the section. Try again.' }
  }
}

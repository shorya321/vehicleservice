import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseClosingPanel } from './closing-panel/parse'
import type { ClosingPanelContent } from './closing-panel/schema'
import { CMS_BLOCKS_TAG, blockTag, type CmsBlockKey } from './types'

const REVALIDATE_SECONDS = 3600

/** Raw stored content, or null on a miss or a database error. */
async function fetchBlock(key: CmsBlockKey): Promise<unknown> {
  try {
    const { data, error } = await createAdminClient()
      .from('cms_blocks')
      .select('content')
      .eq('key', key)
      .maybeSingle()

    if (error) {
      console.error(`[cms] Failed to load block ${key}:`, error.message)
      return null
    }
    return data?.content ?? null
  } catch (error: unknown) {
    console.error(`[cms] Unexpected error loading block ${key}:`, error)
    return null
  }
}

function getBlock(key: CmsBlockKey): Promise<unknown> {
  const cached = unstable_cache(() => fetchBlock(key), ['cms-block', key, 'v1'], {
    revalidate: REVALIDATE_SECONDS,
    tags: [CMS_BLOCKS_TAG, blockTag(key)],
  })
  return cached()
}

/**
 * The shared closing panel. Parsed after the cache, like page content, so an
 * entry cached by an older build still gets every current field.
 */
export async function getClosingPanel(): Promise<ClosingPanelContent> {
  return parseClosingPanel(await getBlock('closing-panel'))
}

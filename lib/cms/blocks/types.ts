/** Keys allowed by the cms_blocks check constraint. */
export const CMS_BLOCK_KEYS = ['closing-panel'] as const
export type CmsBlockKey = (typeof CMS_BLOCK_KEYS)[number]

/** Cache tags. Every public read of a block is tagged with both. */
export const CMS_BLOCKS_TAG = 'cms-blocks'
export function blockTag(key: CmsBlockKey): string {
  return `cms-block:${key}`
}

/** Pages that render the closing panel, revalidated when it is saved. */
export const CLOSING_PANEL_PATHS = ['/blog', '/about', '/faq'] as const

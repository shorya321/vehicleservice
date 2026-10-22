/** Longest alt text the blog admin accepts for a featured or category image. */
export const IMAGE_ALT_MAX = 160

/**
 * The alt text to store beside an image: trimmed, null when empty, and always
 * null when there is no image, so a removed photo never leaves a stale
 * description behind.
 */
export function normaliseImageAlt(alt: string | null | undefined, imageUrl: string | null): string | null {
  if (!imageUrl) {
    return null
  }
  const value = alt?.trim() ?? ''
  if (value.length > IMAGE_ALT_MAX) {
    throw new Error(`Keep the image description under ${IMAGE_ALT_MAX} characters`)
  }
  return value || null
}

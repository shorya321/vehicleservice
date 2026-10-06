import { z } from 'zod'

/**
 * Building blocks shared by every page template's schema. Plain text only:
 * short fields render inside headings and list items, where markup would
 * break both the layout and the structured data built from them.
 */

/** Required single-line or short multi-line text with a hard length cap. */
export function text(max: number): z.ZodString {
  return z.string().trim().min(1, 'Required').max(max, `Keep it under ${max} characters`)
}

/** Optional text: empty string means "not set". */
export function optionalText(max: number): z.ZodString {
  return z.string().trim().max(max, `Keep it under ${max} characters`)
}

const HREF_PATTERN = /^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/

export const href = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(300)
  .refine(
    (value) => HREF_PATTERN.test(value),
    'Use a path like /contact, an #anchor, or a full https:// link'
  )

/** Site-relative path (`/images/x.webp`) or an https URL from storage. */
export const imageSrc = z
  .string()
  .trim()
  .min(1, 'Add an image')
  .max(500)
  .refine(
    (value) => value.startsWith('/') || value.startsWith('https://'),
    'Upload an image or use a site path'
  )

export const ctaSchema = z.object({
  label: text(40),
  href,
})

export const sectionHeaderSchema = z.object({
  visible: z.boolean(),
  eyebrow: text(40),
  title: text(90),
  body: optionalText(320),
})

export type Cta = z.infer<typeof ctaSchema>
export type SectionHeader = z.infer<typeof sectionHeaderSchema>

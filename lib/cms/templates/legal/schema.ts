import { z } from 'zod'
import { optionalText, text } from '@/lib/cms/fields'

/** URL fragment for a section: lowercase words joined by hyphens. */
export const ANCHOR_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const legalSectionSchema = z.object({
  /** Anchor in the URL (/terms#cancellation-and-refund). Keep stable once published. */
  id: z.string().trim().min(1, 'Required').max(80).regex(ANCHOR_PATTERN, 'Use lowercase words joined by hyphens'),
  /** The section's H2. */
  title: text(100),
  /** Shorter label in the side contents list. */
  toc_label: text(60),
  /** Rich text from the editor. Sanitised again on render. */
  body: z.string().trim().min(1, 'Required').max(20000),
})

export const legalContentSchema = z
  .object({
    hero: z.object({
      eyebrow: text(30),
      title: text(70),
      intro: optionalText(220),
    }),
    /** Shown as typed, e.g. "1 July 2026". Update it when the terms change. */
    last_updated: text(40),
    sections: z.array(legalSectionSchema).min(1, 'Add at least one section').max(40),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>()
    value.sections.forEach((section, index) => {
      if (seen.has(section.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', index, 'id'],
          message: 'Each section needs its own anchor',
        })
      }
      seen.add(section.id)
    })
  })

export type LegalContent = z.infer<typeof legalContentSchema>
export type LegalSection = z.infer<typeof legalSectionSchema>

/** Turns a heading into an anchor: "Cancellation & Refund" -> "cancellation-refund". */
export function toAnchor(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

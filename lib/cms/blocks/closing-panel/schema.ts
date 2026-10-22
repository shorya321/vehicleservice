import { z } from 'zod'
import { ctaSchema, imageSrc, optionalText, text } from '@/lib/cms/fields'

/**
 * The closing panel above the footer on Blog, About and FAQ: one copy,
 * edited once under Admin > Pages > Shared sections. Vendors own the cars,
 * so nothing here may claim a fleet as ours.
 */
export const closingPanelSchema = z.object({
  visible: z.boolean(),
  eyebrow: text(40),
  title: text(90),
  body: optionalText(320),
  primary: ctaSchema,
  secondary: ctaSchema,
  trust: z.array(optionalText(40)).length(3),
  images: z.array(imageSrc).length(2),
  /** One description per photo, same order as `images`. */
  imageAlts: z.array(optionalText(140)).length(2),
})

export type ClosingPanelContent = z.infer<typeof closingPanelSchema>

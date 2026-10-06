import { z } from 'zod'
import { ctaSchema, optionalText, text } from '@/lib/cms/fields'

/**
 * Contact page copy. Email, phone and office address are not here: they come
 * from Settings > General, so the page can never disagree with the header,
 * footer and emails. The form itself stays in code.
 */

const ledgerItemSchema = z.object({
  label: text(20),
  value: text(40),
})

const sideCardSchema = z.object({
  label: text(40),
  body: text(300),
})

export const contactContentSchema = z.object({
  hero: z.object({
    eyebrow: text(40),
    title: text(90),
    body: optionalText(320),
    reply: ledgerItemSchema,
    desk: ledgerItemSchema,
  }),
  details: z.object({
    heading: text(40),
    hours: text(60),
    travelling: sideCardSchema.extend({ cta_label: text(30) }),
    corporate: sideCardSchema,
  }),
  promises: z.object({
    visible: z.boolean(),
    eyebrow: text(40),
    title: text(90),
    items: z
      .array(z.object({ title: text(60), body: text(260), meta: optionalText(40) }))
      .length(3),
  }),
  faq: z.object({
    visible: z.boolean(),
    eyebrow: text(40),
    title: text(90),
    body: optionalText(320),
    cta: ctaSchema,
    items: z
      .array(z.object({ question: text(140), answer: text(800) }))
      .min(1, 'Add at least one question')
      .max(20),
  }),
})

export type ContactContent = z.infer<typeof contactContentSchema>
export type ContactSectionKey = keyof ContactContent

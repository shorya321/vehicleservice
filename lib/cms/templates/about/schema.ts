import { z } from 'zod'
import { ctaSchema, href, imageSrc, optionalText, text } from '@/lib/cms/fields'

/**
 * About page copy, laid out on the blog board (bold title, featured photo,
 * photo cards, number rows, closing plate). Infinia is a marketplace: vendors
 * own the cars and employ the drivers, so nothing here may claim a fleet.
 */

const figureSchema = z.object({
  label: text(20),
  value: text(16),
})

const stepSchema = z.object({
  tag: text(24),
  title: text(60),
  body: text(200),
  image: imageSrc,
})

const valueSchema = z.object({
  figure: text(10),
  unit: optionalText(12),
  title: text(60),
  body: text(220),
})

const placeSchema = z.object({
  name: text(40),
  note: optionalText(60),
  image: imageSrc,
})

const sectionHead = {
  visible: z.boolean(),
  eyebrow: text(40),
  title: text(90),
  lede: optionalText(200),
}

export const aboutContentSchema = z.object({
  hero: z.object({
    eyebrow: text(40),
    title: text(60),
    accent: optionalText(30),
    body: text(320),
    primary: ctaSchema,
    secondary: ctaSchema,
    figures: z.array(figureSchema).length(3),
    feature: z.object({
      image: imageSrc,
      alt: optionalText(140),
      tag: text(30),
      eyebrow: text(30),
      title: text(90),
      metaStart: optionalText(40),
      metaEnd: optionalText(40),
    }),
    note: z.object({ text: text(60), label: text(30), href }),
    stat: z.object({ eyebrow: text(30), value: text(16), caption: text(40) }),
  }),
  steps: z.object({ ...sectionHead, items: z.array(stepSchema).length(3) }),
  values: z.object({ ...sectionHead, items: z.array(valueSchema).length(3) }),
  places: z.object({
    ...sectionHead,
    items: z.array(placeSchema).min(1, 'Add at least one place').max(8),
  }),
  close: z.object({
    visible: z.boolean(),
    eyebrow: text(40),
    title: text(90),
    body: optionalText(320),
    primary: ctaSchema,
    secondary: ctaSchema,
    trust: z.array(optionalText(40)).length(3),
    images: z.array(imageSrc).length(2),
  }),
})

export type AboutContent = z.infer<typeof aboutContentSchema>
export type AboutSectionKey = keyof AboutContent

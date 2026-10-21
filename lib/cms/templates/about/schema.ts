import { z } from 'zod'
import { ctaSchema, imageSrc, optionalText, text } from '@/lib/cms/fields'

/**
 * About page copy, laid out on the blog board (bold title, featured photo,
 * photo cards, number rows), then the trust sections: story, vetting, the
 * company's legal and contact facts, partner recruiting and an FAQ. Blank
 * company facts are hidden, never shown as placeholders. The closing panel is
 * shared with Blog and FAQ and lives in lib/cms/blocks. Infinia is a marketplace: vendors own the cars and
 * employ the drivers, so nothing here may claim a fleet.
 */

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

const cardSchema = z.object({
  title: text(60),
  body: text(220),
})

const faqItemSchema = z.object({
  question: text(140),
  answer: text(800),
})

const sectionHead = {
  visible: z.boolean(),
  eyebrow: text(40),
  title: text(90),
}

export const aboutContentSchema = z.object({
  hero: z.object({
    eyebrow: text(40),
    title: text(60),
    accent: optionalText(30),
    body: text(320),
    primary: ctaSchema,
    secondary: ctaSchema,
    feature: z.object({
      image: imageSrc,
      alt: optionalText(140),
      tag: text(30),
      eyebrow: text(30),
      title: text(90),
      metaStart: optionalText(40),
      metaEnd: optionalText(40),
    }),
    stat: z.object({ eyebrow: text(30), value: text(16), caption: text(40) }),
  }),
  steps: z.object({ ...sectionHead, items: z.array(stepSchema).length(3) }),
  values: z.object({ ...sectionHead, items: z.array(valueSchema).length(3) }),
  story: z.object({
    ...sectionHead,
    paragraphs: z.array(optionalText(600)).length(2),
    image: z.union([imageSrc, z.literal('')]),
    imageAlt: optionalText(140),
  }),
  vetting: z.object({ ...sectionHead, items: z.array(cardSchema).length(4), footnote: optionalText(200) }),
  company: z.object({
    ...sectionHead,
    legalName: optionalText(80),
    licence: optionalText(80),
    licenceIssuer: optionalText(80),
    founded: optionalText(10),
    deskHours: optionalText(80),
    payments: optionalText(120),
    zonesNote: optionalText(120),
    zonesLink: ctaSchema,
  }),
  partner: z.object({
    ...sectionHead,
    items: z.array(cardSchema).length(3),
    primary: ctaSchema,
    secondary: ctaSchema,
    footnote: optionalText(200),
  }),
  faq: z.object({ ...sectionHead, items: z.array(faqItemSchema).min(1, 'Add at least one question').max(12) }),
})

export type AboutContent = z.infer<typeof aboutContentSchema>
export type AboutSectionKey = keyof AboutContent

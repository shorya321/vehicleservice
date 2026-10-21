import { z } from 'zod'
import { ctaSchema, imageSrc, optionalText, text } from '@/lib/cms/fields'

/**
 * /services copy on the blog board: the hub that names every way to book and
 * links down to search, routes and business. It targets "car with driver
 * dubai" and "private driver dubai"; the homepage owns "dubai chauffeur
 * service", so neither the title nor the H1 may use it. No prices: fares come
 * from the search. Infinia is a marketplace, so nothing here may claim a fleet.
 */

const cardSchema = z.object({
  title: text(60),
  body: text(220),
})

const serviceSchema = z.object({
  title: text(40),
  body: text(200),
  image: imageSrc,
  cta: ctaSchema,
})

const pointSchema = z.object({
  label: text(30),
  value: text(120),
})

const vehicleClassSchema = z.object({
  name: text(30),
  seats: text(4),
  bags: text(4),
  models: text(160),
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

export const FARE_INCLUDED_SLOTS = 8
export const FARE_EXTRA_SLOTS = 4

export const servicesContentSchema = z.object({
  hero: z.object({
    eyebrow: text(40),
    title: text(60),
    accent: optionalText(30),
    body: text(320),
    primary: ctaSchema,
    secondary: ctaSchema,
    chips: z.array(optionalText(40)).length(3),
    image: imageSrc,
    imageAlt: optionalText(140),
    imageTag: text(30),
  }),
  ways: z.object({ ...sectionHead, items: z.array(serviceSchema).length(4) }),
  airport: z.object({
    ...sectionHead,
    items: z.array(cardSchema).length(3),
    note: optionalText(120),
    link: ctaSchema,
  }),
  hourly: z.object({
    ...sectionHead,
    body: text(600),
    points: z.array(pointSchema).length(3),
    cta: ctaSchema,
    image: z.union([imageSrc, z.literal('')]),
    imageAlt: optionalText(140),
  }),
  beyond: z.object({ ...sectionHead, items: z.array(cardSchema).length(2) }),
  business: z.object({
    ...sectionHead,
    items: z.array(cardSchema).length(3),
    primary: ctaSchema,
    secondary: ctaSchema,
  }),
  fare: z.object({
    ...sectionHead,
    included: z.array(optionalText(80)).length(FARE_INCLUDED_SLOTS),
    extras: z.array(optionalText(120)).length(FARE_EXTRA_SLOTS),
    onRequest: z.array(optionalText(80)).length(FARE_EXTRA_SLOTS),
    footnote: optionalText(240),
  }),
  fleet: z.object({ ...sectionHead, items: z.array(vehicleClassSchema).length(5), cta: ctaSchema }),
  faq: z.object({ ...sectionHead, items: z.array(faqItemSchema).min(1, 'Add at least one question').max(12) }),
})

export type ServicesContent = z.infer<typeof servicesContentSchema>
export type ServicesSectionKey = keyof ServicesContent

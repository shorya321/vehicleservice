import { z } from 'zod'
import { ctaSchema, imageSrc, optionalText, sectionHeaderSchema, text } from '@/lib/cms/fields'

/**
 * Home page content. List lengths are fixed wherever the layout is built for
 * an exact count (a 4-up city strip, a 3-up promise row, a 2x2 bento, a 4-item
 * checklist), so an edit can change words and pictures but never the shape the
 * settled design depends on. Only the FAQ list grows and shrinks.
 */

const heroStatSchema = z.object({
  label: text(20),
  value: text(12),
  /** Renders a star after the value, and hides the stat while there are no reviews. */
  is_rating: z.boolean(),
})

export const heroSchema = z.object({
  eyebrow: text(60),
  eyebrow_accent: optionalText(30),
  title: text(70),
  summary: text(220),
  trust: z.array(text(40)).length(3),
  stats: z.array(heroStatSchema).length(3),
})

export const afterYouBookSchema = sectionHeaderSchema.extend({
  primary_cta: ctaSchema,
  secondary_cta: ctaSchema,
})

export const citySchema = z.object({
  name: text(40),
  meta: optionalText(30),
  image: imageSrc,
  alt: text(160),
})

export const citiesSchema = sectionHeaderSchema.extend({
  items: z.array(citySchema).length(4),
})

export const benefitSchema = z.object({
  title: text(60),
  body: text(260),
  meta: optionalText(40),
})

export const benefitsSchema = sectionHeaderSchema.extend({
  items: z.array(benefitSchema).length(3),
})

export const onboardItemSchema = z.object({
  title: text(50),
  body: text(220),
  meta: optionalText(40),
  /** Only the first two bento cells are photographic; empty means text tile. */
  image: z.string().trim().max(500),
  alt: optionalText(160),
})

export const onboardSchema = sectionHeaderSchema.extend({
  items: z.array(onboardItemSchema).length(4),
})

export const testimonialsSchema = sectionHeaderSchema.extend({
  cta: ctaSchema,
})

export const accountFactSchema = z.object({
  title: text(40),
  detail: text(120),
})

export const accountSchema = sectionHeaderSchema.extend({
  facts: z.array(accountFactSchema).length(4),
  primary_cta: ctaSchema,
  secondary_cta: ctaSchema,
})

export const faqItemSchema = z.object({
  question: text(140),
  answer: text(800),
})

export const faqSchema = sectionHeaderSchema.extend({
  cta: ctaSchema,
  items: z.array(faqItemSchema).min(1, 'Add at least one question').max(20),
})

export const homeContentSchema = z.object({
  hero: heroSchema,
  after_you_book: afterYouBookSchema,
  routes: sectionHeaderSchema,
  cities: citiesSchema,
  benefits: benefitsSchema,
  fleet: sectionHeaderSchema,
  onboard: onboardSchema,
  testimonials: testimonialsSchema,
  account: accountSchema,
  faq: faqSchema,
})

export type HomeContent = z.infer<typeof homeContentSchema>
export type HomeSectionKey = keyof HomeContent
export type HeroContent = z.infer<typeof heroSchema>
export type FaqItem = z.infer<typeof faqItemSchema>

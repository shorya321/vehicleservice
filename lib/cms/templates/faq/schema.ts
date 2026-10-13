import { z } from 'zod'
import { ctaSchema, optionalText, text } from '@/lib/cms/fields'

/**
 * /faq copy on the blog board: hero with search, questions grouped by topic,
 * closing help panel. Every question is also sent to Google as FAQPage data.
 */

export const MAX_FAQ_TOPICS = 8
export const MAX_FAQ_QUESTIONS = 20

const faqQuestionSchema = z.object({
  question: text(140),
  answer: text(800),
})

const faqTopicSchema = z.object({
  name: text(40),
  blurb: optionalText(120),
  items: z.array(faqQuestionSchema).min(1, 'Add at least one question').max(MAX_FAQ_QUESTIONS),
})

export const faqContentSchema = z.object({
  hero: z.object({
    eyebrow: text(40),
    title: text(60),
    accent: optionalText(30),
    body: text(240),
  }),
  topics: z.array(faqTopicSchema).min(1, 'Add at least one topic').max(MAX_FAQ_TOPICS),
  help: z.object({
    visible: z.boolean(),
    eyebrow: text(40),
    title: text(90),
    replies: optionalText(30),
    hours: optionalText(40),
    primary: ctaSchema,
    secondary: ctaSchema,
  }),
})

export type FaqContent = z.infer<typeof faqContentSchema>
export type FaqSectionKey = keyof FaqContent
export type FaqTopic = FaqContent['topics'][number]

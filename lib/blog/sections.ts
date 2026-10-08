import { z } from 'zod'
import { toAnchor } from '@/lib/cms/templates/legal/schema'

/**
 * A blog post body is a list of sections: a heading plus rich text. The list
 * lives in `blog_posts.sections`; `blog_posts.content` keeps an HTML mirror
 * (see `sectionsToHtml`) because excerpts and reading time still read it.
 */

export const MAX_SECTIONS = 30
export const MAX_FAQS = 20

export const blogSectionSchema = z.object({
  title: z.string().trim().min(1, 'Add a heading').max(120, 'Keep it under 120 characters'),
  /** Rich text from the editor. Sanitised again on render. */
  body: z.string().max(20000, 'This section is too long, split it in two'),
})

export const blogSectionsSchema = z
  .array(blogSectionSchema)
  .min(1, 'Add at least one section')
  .max(MAX_SECTIONS, `Keep it to ${MAX_SECTIONS} sections`)

export const blogFaqSchema = z.object({
  question: z.string().trim().min(1, 'Add the question').max(140, 'Keep it under 140 characters'),
  answer: z.string().trim().min(1, 'Add the answer').max(800, 'Keep it under 800 characters'),
})

export const blogFaqsSchema = z.array(blogFaqSchema).max(MAX_FAQS, `Keep it to ${MAX_FAQS} questions`)

export type BlogSection = z.infer<typeof blogSectionSchema>
export type BlogFaq = z.infer<typeof blogFaqSchema>
export interface AnchoredSection extends BlogSection {
  id: string
}

/** The FAQ block always renders at `#faq`, so a section may not take it. */
export const FAQ_ANCHOR = 'faq'

const INTRO_TITLE = 'Introduction'
const H2_PATTERN = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

function headingText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Splits a pre-sections post (one HTML string) at its `<h2>`s. Text before
 * the first heading becomes an "Introduction" section. Used for posts saved
 * before sections existed, until their next save writes the new shape.
 */
export function legacyContentToSections(html: string | null | undefined): BlogSection[] {
  if (!html || !html.trim()) return []

  const headings: { index: number; end: number; title: string }[] = []
  const pattern = new RegExp(H2_PATTERN.source, 'gi')
  for (let m = pattern.exec(html); m !== null; m = pattern.exec(html)) {
    headings.push({ index: m.index, end: m.index + m[0].length, title: headingText(m[1]) })
  }

  const intro = html.slice(0, headings[0]?.index ?? html.length).trim()
  const introSection: BlogSection[] = intro ? [{ title: INTRO_TITLE, body: intro }] : []

  return introSection.concat(
    headings.map((h, i) => ({
      title: h.title || INTRO_TITLE,
      body: html.slice(h.end, headings[i + 1]?.index ?? html.length).trim(),
    }))
  )
}

/** Stored sections when the post has them, else the legacy content split. */
export function getPostSections(post: { sections?: unknown; content?: string | null }): BlogSection[] {
  const parsed = z.array(blogSectionSchema).safeParse(post.sections)
  if (parsed.success && parsed.data.length > 0) return parsed.data
  return legacyContentToSections(post.content)
}

/** Unique, title-derived anchors: "Which terminal?" -> `which-terminal`. */
export function withAnchors(sections: readonly BlogSection[]): AnchoredSection[] {
  const seen = new Set<string>([FAQ_ANCHOR])
  const used = new Set<string>()
  return sections.map((section, i) => {
    const base = toAnchor(section.title) || `section-${i + 1}`
    let id = base
    for (let n = 2; seen.has(id) || used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    return { ...section, id }
  })
}

/** HTML mirror written to `blog_posts.content` on every save. */
export function sectionsToHtml(sections: readonly BlogSection[]): string {
  return sections.map((s) => `<h2>${escapeHtml(s.title.trim())}</h2>${s.body.trim()}`).join('')
}

/** Rows left fully blank in the editor mean "no question", not an error. */
export function cleanFaqs(faqs: readonly { question: string; answer: string }[]): { question: string; answer: string }[] {
  return faqs
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
    .filter((f) => f.question || f.answer)
}

/** Stored FAQs, tolerating a malformed column. */
export function getPostFaqs(post: { faqs?: unknown }): BlogFaq[] {
  const parsed = blogFaqsSchema.safeParse(post.faqs)
  return parsed.success ? parsed.data : []
}

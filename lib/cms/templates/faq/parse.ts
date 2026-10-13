import { DEFAULT_FAQ_CONTENT } from './defaults'
import { faqContentSchema, type FaqContent, type FaqSectionKey } from './schema'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Section by section, like About: one bad section never blanks the page. */
export function parseFaqContent(raw: unknown): FaqContent {
  if (!isRecord(raw)) {
    return DEFAULT_FAQ_CONTENT
  }

  const keys = Object.keys(DEFAULT_FAQ_CONTENT) as FaqSectionKey[]
  return keys.reduce<FaqContent>((content, key) => {
    const section = raw[key]
    // Topics is a list: it is taken whole or not at all, never merged.
    const candidate = key === 'topics' ? section : isRecord(section) ? { ...DEFAULT_FAQ_CONTENT[key], ...section } : undefined
    if (candidate === undefined) {
      return content
    }
    const parsed = faqContentSchema.shape[key].safeParse(candidate)
    return parsed.success ? { ...content, [key]: parsed.data } : content
  }, DEFAULT_FAQ_CONTENT)
}

/** Anchor id for a topic, unique on the page even when two names collide. */
export function faqTopicIds(topics: readonly { name: string }[]): string[] {
  const seen = new Map<string, number>()
  return topics.map((topic) => {
    const base = topic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'topic'
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count + 1}`
  })
}

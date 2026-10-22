import { withItemAlts } from '@/lib/cms/item-alts'
import { DEFAULT_ABOUT_CONTENT } from './defaults'
import { aboutContentSchema, type AboutContent, type AboutSectionKey } from './schema'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Section by section, like the contact page: one bad section never blanks the page. */
export function parseAboutContent(raw: unknown): AboutContent {
  if (!isRecord(raw)) {
    return DEFAULT_ABOUT_CONTENT
  }

  const keys = Object.keys(DEFAULT_ABOUT_CONTENT) as AboutSectionKey[]
  return keys.reduce<AboutContent>((content, key) => {
    const section = raw[key]
    if (!isRecord(section)) {
      return content
    }
    const parsed = aboutContentSchema.shape[key].safeParse({ ...DEFAULT_ABOUT_CONTENT[key], ...withItemAlts(section) })
    return parsed.success ? { ...content, [key]: parsed.data } : content
  }, DEFAULT_ABOUT_CONTENT)
}

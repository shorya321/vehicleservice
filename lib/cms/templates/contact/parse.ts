import { DEFAULT_CONTACT_CONTENT } from './defaults'
import { contactContentSchema, type ContactContent, type ContactSectionKey } from './schema'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Section by section, like the home page: one bad section never blanks the page. */
export function parseContactContent(raw: unknown): ContactContent {
  if (!isRecord(raw)) {
    return DEFAULT_CONTACT_CONTENT
  }

  const keys = Object.keys(DEFAULT_CONTACT_CONTENT) as ContactSectionKey[]
  return keys.reduce<ContactContent>((content, key) => {
    const section = raw[key]
    if (!isRecord(section)) {
      return content
    }
    const parsed = contactContentSchema.shape[key].safeParse({ ...DEFAULT_CONTACT_CONTENT[key], ...section })
    return parsed.success ? { ...content, [key]: parsed.data } : content
  }, DEFAULT_CONTACT_CONTENT)
}

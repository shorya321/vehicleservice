import { DEFAULT_HOME_CONTENT } from './defaults'
import { homeContentSchema, type HomeContent, type HomeSectionKey } from './schema'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Reads stored home content section by section. A section that is missing or
 * fails validation falls back to its shipped default on its own, so one bad
 * edit (or a field added in a later release) never blanks the whole page.
 */
export function parseHomeContent(raw: unknown): HomeContent {
  if (!isRecord(raw)) {
    return DEFAULT_HOME_CONTENT
  }

  const keys = Object.keys(DEFAULT_HOME_CONTENT) as HomeSectionKey[]

  return keys.reduce<HomeContent>(
    (content, key) => {
      const section = raw[key]
      if (!isRecord(section)) {
        return content
      }

      // Shallow-merge onto the default so a section saved before a field
      // existed still validates, with the new field at its default.
      const candidate = { ...DEFAULT_HOME_CONTENT[key], ...section }
      const parsed = homeContentSchema.shape[key].safeParse(candidate)

      return parsed.success ? { ...content, [key]: parsed.data } : content
    },
    DEFAULT_HOME_CONTENT
  )
}

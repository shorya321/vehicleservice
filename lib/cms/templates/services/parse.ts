import { withItemAlts } from '@/lib/cms/item-alts'
import { DEFAULT_SERVICES_CONTENT } from './defaults'
import { servicesContentSchema, type ServicesContent, type ServicesSectionKey } from './schema'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Section by section, like About: one bad section never blanks the page. */
export function parseServicesContent(raw: unknown): ServicesContent {
  if (!isRecord(raw)) {
    return DEFAULT_SERVICES_CONTENT
  }

  const keys = Object.keys(DEFAULT_SERVICES_CONTENT) as ServicesSectionKey[]
  return keys.reduce<ServicesContent>((content, key) => {
    const section = raw[key]
    if (!isRecord(section)) {
      return content
    }
    const parsed = servicesContentSchema.shape[key].safeParse({ ...DEFAULT_SERVICES_CONTENT[key], ...withItemAlts(section) })
    return parsed.success ? { ...content, [key]: parsed.data } : content
  }, DEFAULT_SERVICES_CONTENT)
}

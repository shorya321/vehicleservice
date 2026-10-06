import { legalContentSchema, type LegalContent } from './schema'

/**
 * A legal page is one document: unlike the home page it is not merged section
 * by section, since half an edited policy beside half the old one would read
 * as a contradiction. Anything invalid falls back to the shipped text whole.
 */
export function parseLegalContent(raw: unknown, fallback: LegalContent): LegalContent {
  if (typeof raw !== 'object' || raw === null || Object.keys(raw).length === 0) {
    return fallback
  }
  const parsed = legalContentSchema.safeParse(raw)
  return parsed.success ? parsed.data : fallback
}

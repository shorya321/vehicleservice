import { DEFAULT_CLOSING_PANEL } from './defaults'
import { closingPanelSchema, type ClosingPanelContent } from './schema'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Stored fields over the defaults. Anything invalid falls back to the shipped
 * copy as a whole, so a bad row never blanks or breaks the pages it is on.
 */
export function parseClosingPanel(raw: unknown): ClosingPanelContent {
  if (!isRecord(raw)) {
    return DEFAULT_CLOSING_PANEL
  }
  const parsed = closingPanelSchema.safeParse({ ...DEFAULT_CLOSING_PANEL, ...raw })
  return parsed.success ? parsed.data : DEFAULT_CLOSING_PANEL
}

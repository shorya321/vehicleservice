function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Photo alt text arrived after some pages were saved. Give each stored list
 * item an empty `alt` when it has none, so those rows still parse instead of
 * falling back to the defaults. Sections without `items` pass through, and
 * schemas without `alt` strip the key again.
 */
export function withItemAlts(section: Record<string, unknown>): Record<string, unknown> {
  const items = section.items
  if (!Array.isArray(items)) {
    return section
  }
  return {
    ...section,
    items: items.map((item) => (isRecord(item) && !('alt' in item) ? { ...item, alt: '' } : item)),
  }
}

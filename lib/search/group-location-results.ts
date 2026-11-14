import type {
  GroupedLocationResults,
  LocationSearchResult,
} from '@/lib/types/location'

/**
 * Groups location results by type for the search dropdown.
 *
 * Search results carry a relevance score, so the group holding the best match
 * comes first and a strong hotel match is not buried under weak airport or bus
 * stop matches. The popular list has no relevance, so it keeps the fixed type
 * order (airports first). Order inside each group is left as the RPC sent it.
 */
export function groupLocationResults(
  results: readonly LocationSearchResult[]
): GroupedLocationResults[] {
  const groups = new Map<string, GroupedLocationResults>()
  const bestScore = new Map<string, number>()

  for (const result of results) {
    const label = result.location_type_label
    const existing = groups.get(label)
    if (existing) {
      groups.set(label, { ...existing, locations: [...existing.locations, result] })
    } else {
      groups.set(label, {
        label,
        icon: result.location_type_icon,
        sortOrder: result.location_type_sort,
        locations: [result],
      })
    }

    const score = Number.isFinite(result.relevance) ? result.relevance : null
    if (score !== null && score > (bestScore.get(label) ?? -Infinity)) {
      bestScore.set(label, score)
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    const scoreA = bestScore.get(a.label)
    const scoreB = bestScore.get(b.label)
    if (scoreA !== undefined && scoreB !== undefined && scoreA !== scoreB) {
      return scoreB - scoreA
    }
    return a.sortOrder - b.sortOrder
  })
}

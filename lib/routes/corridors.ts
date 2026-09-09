import type { PopularRoute } from '@/components/search/popular-routes'

/**
 * A corridor is a route with its mirror folded in.
 *
 * `get_popular_routes()` returns each direction as its own row, so a pair that
 * is curated in both directions arrives twice and, before this, rendered twice —
 * spending two of the six home-page slots on the same journey while pushing
 * genuinely distinct corridors off the end of the list.
 *
 * Deliberately NOT recorded: which corridors had both direction rows. That fact
 * is about admin data entry, not about the service. `routes` is only the
 * fallback lookup in app/search/results/actions.ts; bookability and price come
 * from `zone_pricing`, where every zone pair has a reverse and all but two are
 * priced identically. Surfacing "both ways" on the subset that happens to be
 * curated twice implies the rest are one-way, which is false.
 */
export interface Corridor {
  /** The id of the direction that was kept. */
  id: string
  originName: string
  destinationName: string
  originSlug?: string
  destinationSlug?: string
  originLocationId: string
  destinationLocationId: string
  distance: number
  duration: number
}

/** Rail length in px for the shortest corridor in the set. */
export const RAIL_MIN = 30
/** Rail length in px for the longest corridor in the set. */
export const RAIL_MAX = 76
/** Used when every corridor is the same distance, so there is no range to scale across. */
export const RAIL_MID = 48

/**
 * Order-independent key for a pair of endpoints.
 *
 * Built from location ids rather than display names: two distinct locations can
 * share a name (an airport's terminals, a mall and its metro stop), and keying
 * on names would silently merge two real corridors into one.
 */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

/**
 * Merge reversible pairs, preserving input order and the first-seen direction.
 *
 * The kept direction matters: its origin/destination slugs are what
 * `buildSearchUrl` turns into an href, and only a direction that exists as a row
 * in `routes` is guaranteed to resolve. The reverse is recorded as a flag, not
 * by rewriting the link.
 */
export function collapseCorridors(routes: PopularRoute[]): Corridor[] {
  const seen = new Set<string>()
  const corridors: Corridor[] = []

  for (const route of routes) {
    const key = pairKey(route.originLocationId, route.destinationLocationId)
    if (seen.has(key)) continue

    seen.add(key)
    corridors.push({
      id: route.id,
      originName: route.originName,
      destinationName: route.destinationName,
      originSlug: route.originSlug,
      destinationSlug: route.destinationSlug,
      originLocationId: route.originLocationId,
      destinationLocationId: route.destinationLocationId,
      distance: route.distance,
      duration: route.duration,
    })
  }

  return corridors
}

/**
 * Rail length in px for one distance, scaled across the set's own range.
 *
 * The rail is the section's only quantitative device, so it is scaled to the
 * routes actually on screen rather than to an absolute km figure: whatever the
 * six corridors happen to be, the shortest reads short and the longest reads
 * long. Returns RAIL_MID when min and max are equal, which both guards the
 * divide-by-zero and is the honest answer — with no range there is nothing to
 * compare.
 */
export function railHeight(distance: number, min: number, max: number): number {
  if (max <= min) return RAIL_MID
  const ratio = (distance - min) / (max - min)
  return Math.round(RAIL_MIN + ratio * (RAIL_MAX - RAIL_MIN))
}

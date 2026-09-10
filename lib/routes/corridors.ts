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
  /** Public URL of the route photo, from either direction. See collapseCorridors. */
  image: string | null
  imageAlt: string | null
}

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
 *
 * The photo is the one thing taken from either direction. It lives on the route
 * row, and an admin editing "Burj Khalifa to Atlantis" has no way to know that
 * the home page happens to render the opposite direction — so an image uploaded
 * to the mirror would silently never appear. The kept direction still wins when
 * both carry one.
 */
export function collapseCorridors(routes: PopularRoute[]): Corridor[] {
  const seen = new Map<string, Corridor>()
  const corridors: Corridor[] = []

  for (const route of routes) {
    const key = pairKey(route.originLocationId, route.destinationLocationId)
    const kept = seen.get(key)

    if (kept) {
      if (!kept.image && route.image) {
        kept.image = route.image
        kept.imageAlt = route.imageAlt
      }
      continue
    }

    const corridor: Corridor = {
      id: route.id,
      originName: route.originName,
      destinationName: route.destinationName,
      originSlug: route.originSlug,
      destinationSlug: route.destinationSlug,
      originLocationId: route.originLocationId,
      destinationLocationId: route.destinationLocationId,
      distance: route.distance,
      duration: route.duration,
      image: route.image,
      imageAlt: route.imageAlt,
    }

    seen.set(key, corridor)
    corridors.push(corridor)
  }

  return corridors
}

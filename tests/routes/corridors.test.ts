import type { PopularRoute } from '@/components/search/popular-routes'
import {
  collapseCorridors,
  railHeight,
  RAIL_MIN,
  RAIL_MAX,
  RAIL_MID,
} from '@/lib/routes/corridors'

/**
 * Builds a PopularRoute with the fields collapseCorridors actually reads.
 * `startingPrice` and `searchCount` are always 0 in production (app/actions.ts
 * hardcodes both), so they are pinned here rather than parameterised.
 */
function route(partial: Partial<PopularRoute> & Pick<PopularRoute, 'id'>): PopularRoute {
  return {
    slug: `${partial.id}-slug`,
    originLocationId: 'loc-a',
    destinationLocationId: 'loc-b',
    originName: 'Origin',
    destinationName: 'Destination',
    originCity: 'Dubai',
    destinationCity: 'Dubai',
    originSlug: 'origin',
    destinationSlug: 'destination',
    startingPrice: 0,
    searchCount: 0,
    distance: 10,
    duration: 12,
    ...partial,
  }
}

describe('collapseCorridors', () => {
  it('merges a reversible pair into a single corridor', () => {
    const result = collapseCorridors([
      route({
        id: 'r1',
        originLocationId: 'atlantis',
        destinationLocationId: 'burj',
        originName: 'Atlantis - The Palm',
        destinationName: 'Burj Khalifa',
        distance: 22,
        duration: 25,
      }),
      route({
        id: 'r2',
        originLocationId: 'burj',
        destinationLocationId: 'atlantis',
        originName: 'Burj Khalifa',
        destinationName: 'Atlantis - The Palm',
        distance: 22,
        duration: 25,
      }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].originName).toBe('Atlantis - The Palm')
    expect(result[0].destinationName).toBe('Burj Khalifa')
  })

  it('keeps the first-seen direction, so the href resolves to a real route', () => {
    const result = collapseCorridors([
      route({
        id: 'r1',
        originLocationId: 'burj',
        destinationLocationId: 'atlantis',
        originName: 'Burj Khalifa',
        destinationName: 'Atlantis - The Palm',
        originSlug: 'burj-khalifa',
        destinationSlug: 'atlantis-the-palm',
      }),
      route({
        id: 'r2',
        originLocationId: 'atlantis',
        destinationLocationId: 'burj',
        originName: 'Atlantis - The Palm',
        destinationName: 'Burj Khalifa',
        originSlug: 'atlantis-the-palm',
        destinationSlug: 'burj-khalifa',
      }),
    ])

    expect(result[0].originName).toBe('Burj Khalifa')
    expect(result[0].destinationName).toBe('Atlantis - The Palm')
    expect(result[0].originSlug).toBe('burj-khalifa')
    expect(result[0].id).toBe('r1')
  })

  it('leaves routes sharing only one endpoint as separate corridors', () => {
    const result = collapseCorridors([
      route({ id: 'r1', originLocationId: 'ain', destinationLocationId: 'nakheel' }),
      route({ id: 'r2', originLocationId: 'difc', destinationLocationId: 'ain' }),
    ])

    expect(result).toHaveLength(2)
  })

  it('preserves input order', () => {
    const result = collapseCorridors([
      route({ id: 'r1', originLocationId: 'a', destinationLocationId: 'b' }),
      route({ id: 'r2', originLocationId: 'c', destinationLocationId: 'd' }),
      route({ id: 'r3', originLocationId: 'b', destinationLocationId: 'a' }),
      route({ id: 'r4', originLocationId: 'e', destinationLocationId: 'f' }),
    ])

    expect(result.map((c) => c.id)).toEqual(['r1', 'r2', 'r4'])
  })

  /**
   * The pair key is built from location IDs, not display names. Two distinct
   * locations can share a name (a mall and its metro stop, an airport terminal),
   * and keying on names would silently merge two real corridors into one.
   */
  it('keys on location ids, so corridors sharing display names stay separate', () => {
    const result = collapseCorridors([
      route({
        id: 'r1',
        originLocationId: 'terminal-1',
        destinationLocationId: 'marina',
        originName: 'Dubai Airport',
        destinationName: 'Marina Walk',
      }),
      route({
        id: 'r2',
        originLocationId: 'marina',
        destinationLocationId: 'terminal-3',
        originName: 'Marina Walk',
        destinationName: 'Dubai Airport',
      }),
    ])

    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toEqual(['r1', 'r2'])
  })

  it('returns an empty array for no routes', () => {
    expect(collapseCorridors([])).toEqual([])
  })

  it('carries distance and duration through unchanged', () => {
    const result = collapseCorridors([
      route({ id: 'r1', originLocationId: 'a', destinationLocationId: 'b', distance: 16, duration: 18 }),
    ])

    expect(result[0].distance).toBe(16)
    expect(result[0].duration).toBe(18)
  })
})

describe('railHeight', () => {
  it('gives the shortest corridor the minimum rail', () => {
    expect(railHeight(11, 11, 22)).toBe(RAIL_MIN)
  })

  it('gives the longest corridor the maximum rail', () => {
    expect(railHeight(22, 11, 22)).toBe(RAIL_MAX)
  })

  it('scales linearly in between', () => {
    // Midpoint of 11..22 is 16.5, so it should land halfway up the rail range.
    expect(railHeight(16.5, 11, 22)).toBe(Math.round((RAIL_MIN + RAIL_MAX) / 2))
  })

  /** Guards a divide-by-zero when every popular route is the same distance. */
  it('falls back to the mid rail when every corridor is the same length', () => {
    expect(railHeight(14, 14, 14)).toBe(RAIL_MID)
  })

  it('returns whole pixels', () => {
    expect(Number.isInteger(railHeight(13, 11, 22))).toBe(true)
  })
})

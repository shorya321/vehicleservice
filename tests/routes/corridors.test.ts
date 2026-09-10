import type { PopularRoute } from '@/components/search/popular-routes'
import { collapseCorridors } from '@/lib/routes/corridors'

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
    image: null,
    imageAlt: null,
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

  /**
   * The photo lives on the route row, and an admin editing one direction has no
   * way to know which direction the home page happens to render. Without this,
   * an image uploaded to the mirror would silently never appear.
   */
  it('adopts the mirror direction\'s image when the kept direction has none', () => {
    const result = collapseCorridors([
      route({ id: 'r1', originLocationId: 'atlantis', destinationLocationId: 'burj' }),
      route({
        id: 'r2',
        originLocationId: 'burj',
        destinationLocationId: 'atlantis',
        image: 'https://cdn.example/burj.webp',
        imageAlt: 'The Burj Khalifa at dusk',
      }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('r1')
    expect(result[0].image).toBe('https://cdn.example/burj.webp')
    expect(result[0].imageAlt).toBe('The Burj Khalifa at dusk')
  })

  it('keeps the first-seen direction\'s image when both carry one', () => {
    const result = collapseCorridors([
      route({
        id: 'r1',
        originLocationId: 'atlantis',
        destinationLocationId: 'burj',
        image: 'https://cdn.example/kept.webp',
        imageAlt: 'kept',
      }),
      route({
        id: 'r2',
        originLocationId: 'burj',
        destinationLocationId: 'atlantis',
        image: 'https://cdn.example/mirror.webp',
        imageAlt: 'mirror',
      }),
    ])

    expect(result[0].image).toBe('https://cdn.example/kept.webp')
    expect(result[0].imageAlt).toBe('kept')
  })

  it('leaves the image null when neither direction has one', () => {
    const result = collapseCorridors([
      route({ id: 'r1', originLocationId: 'a', destinationLocationId: 'b' }),
      route({ id: 'r2', originLocationId: 'b', destinationLocationId: 'a' }),
    ])

    expect(result[0].image).toBeNull()
    expect(result[0].imageAlt).toBeNull()
  })

  /** The mirror is folded in for its photo only; nothing else may leak across. */
  it('does not take the mirror\'s endpoints along with its image', () => {
    const result = collapseCorridors([
      route({
        id: 'r1',
        originLocationId: 'atlantis',
        destinationLocationId: 'burj',
        originName: 'Atlantis - The Palm',
        destinationName: 'Burj Khalifa',
        originSlug: 'atlantis-the-palm',
      }),
      route({
        id: 'r2',
        originLocationId: 'burj',
        destinationLocationId: 'atlantis',
        originName: 'Burj Khalifa',
        destinationName: 'Atlantis - The Palm',
        originSlug: 'burj-khalifa',
        image: 'https://cdn.example/burj.webp',
      }),
    ])

    expect(result[0].originName).toBe('Atlantis - The Palm')
    expect(result[0].originSlug).toBe('atlantis-the-palm')
    expect(result[0].image).toBe('https://cdn.example/burj.webp')
  })
})

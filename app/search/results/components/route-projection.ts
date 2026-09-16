/**
 * Places a real latitude/longitude onto the hero's generated street map.
 *
 * That map is built from formulas rather than traced (see
 * components/home/hero/map-geometry.ts), so it is a stylisation, not a
 * projection. Measured against the real city it flattens Dubai's north-south
 * axis by about 4.4x: DXB to the Palm runs at a real dy/dx of 0.686 and is
 * drawn at 0.154. A conformal transform would therefore be the wrong answer -
 * it would put pins in places the drawing does not depict.
 *
 * What this uses instead is an anisotropic fit through the two landmarks the
 * map actually draws, and which components/home/saved-route already labels with
 * their real coordinates: DXB and the crown of the Palm. Both land exactly on
 * the feature they name, and anything between them interpolates. It is a fit to
 * the stylisation, which is the only thing there is to fit to.
 *
 * Because the fit is anchored on Dubai, it is meaningless anywhere else, and
 * `locations` runs east to longitude 76. `projectRoute` returns null rather
 * than drawing a line for any pair it cannot place, and the band then shows the
 * map as plain background.
 */

export interface GeoPoint {
  lat: number
  lng: number
}

export interface MapPoint {
  x: number
  y: number
}

/* Landmark anchors: real coordinates, and where this map draws them. */
const DXB = { lat: 25.2532, lng: 55.3657, x: 1340, y: 520 }
const PALM = { lat: 25.1124, lng: 55.139, x: 454.5, y: 383.9 }

const UNITS_PER_LNG = (DXB.x - PALM.x) / (DXB.lng - PALM.lng)
const UNITS_PER_LAT = (DXB.y - PALM.y) / (DXB.lat - PALM.lat)

/**
 * The window route-band-map.tsx draws, in this map's own units.
 *
 * Width and scale are the approved crop. `y` is lower than the map's own
 * framing would suggest, which lifts everything drawn on it by about 45px at
 * desktop width: the real Palm-to-Downtown line runs lower and flatter than a
 * centred window puts it, far enough down that the destination pin's halo
 * touched the ledger's hairline and the origin pin sat inside the headline
 * rather than above it. Moving the window down in map space moves the trip up
 * on screen, which is the only lever that does not disturb the fabric scale.
 */
export const VIEW = { x: 120, y: 157, w: 1180, h: 560 } as const
export const VIEW_BOX = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`

/* A point a little outside the window still draws usefully - the line runs to
   the edge and the SVG clips it. Far outside means the pair is not in Dubai. */
const SLACK = 0.18

function project({ lat, lng }: GeoPoint): MapPoint {
  return {
    x: DXB.x + (lng - DXB.lng) * UNITS_PER_LNG,
    y: DXB.y + (lat - DXB.lat) * UNITS_PER_LAT,
  }
}

function isPlaceable({ x, y }: MapPoint): boolean {
  const mx = VIEW.w * SLACK
  const my = VIEW.h * SLACK
  return (
    x >= VIEW.x - mx && x <= VIEW.x + VIEW.w + mx && y >= VIEW.y - my && y <= VIEW.y + VIEW.h + my
  )
}

export interface ProjectedRoute {
  from: MapPoint
  to: MapPoint
  /** Quadratic bow, so the trip reads as a journey rather than a ruler line. */
  d: string
}

/**
 * The drawn trip, or null when either end cannot be placed on this map - a
 * zone pair, which has no locations, or a route in another city.
 */
export function projectRoute(
  origin: GeoPoint | null | undefined,
  destination: GeoPoint | null | undefined
): ProjectedRoute | null {
  if (!origin || !destination) return null
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return null
  if (!Number.isFinite(destination.lat) || !Number.isFinite(destination.lng)) return null

  const from = project(origin)
  const to = project(destination)
  if (!isPlaceable(from) || !isPlaceable(to)) return null

  const dx = to.x - from.x
  const dy = to.y - from.y
  const span = Math.hypot(dx, dy)
  // Two locations that resolve to the same spot have no line to draw.
  if (span < 1) return null

  // Control point offset along the normal, so the bow leans the same way
  // whichever direction the trip runs.
  const bow = span * 0.12
  const cx = (from.x + to.x) / 2 + (-dy / span) * bow
  const cy = (from.y + to.y) / 2 + (dx / span) * bow

  const r = (n: number): string => n.toFixed(1)
  return {
    from,
    to,
    d: `M${r(from.x)},${r(from.y)} Q${r(cx)},${r(cy)} ${r(to.x)},${r(to.y)}`,
  }
}

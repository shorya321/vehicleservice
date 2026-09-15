/**
 * Geometry for the "After you book" zone network: DXB Airport as the hub, with
 * arcs to a spread of live Dubai zones placed by real longitude and latitude.
 *
 * Everything is projected into a 0 to 100 square. The SVG draws the arcs with
 * `preserveAspectRatio="none"` and the nodes and labels are HTML positioned by
 * percentage, so text stays at its own pixel size at every plate width.
 */

export type LabelSide = 'l' | 'r'

export interface ZonePoint {
  name: string
  lon: number
  lat: number
}

export interface Zone extends ZonePoint {
  /** Which side of the node the label sits on. */
  side: LabelSide
  /** Label nudge in pixels, for the few pairs that sit close together. */
  dy: number
  /** Kept on small screens. The rest drop their label and keep the node. */
  compact: boolean
}

/* Padded bounds, so the outermost labels still fit inside the drawing. */
const LON_MIN = 54.96
const LON_MAX = 55.5
const LAT_MIN = 24.93
const LAT_MAX = 25.33

/* How far each arc bows away from the straight line, as a share of its length. */
const BOW = -0.1

export const HUB: ZonePoint = { name: 'DXB Airport', lon: 55.365, lat: 25.252 }

export const ZONES: readonly Zone[] = [
  { name: 'Deira', lon: 55.312, lat: 25.276, side: 'l', dy: -4, compact: true },
  { name: 'Sharjah Border', lon: 55.405, lat: 25.305, side: 'r', dy: 0, compact: false },
  { name: 'Mirdif', lon: 55.425, lat: 25.218, side: 'r', dy: 4, compact: false },
  { name: 'Silicon Oasis', lon: 55.382, lat: 25.121, side: 'r', dy: 4, compact: false },
  { name: 'Downtown & DIFC', lon: 55.275, lat: 25.197, side: 'l', dy: -8, compact: true },
  { name: 'Al Barsha', lon: 55.203, lat: 25.109, side: 'r', dy: 12, compact: false },
  { name: 'Palm Jumeirah', lon: 55.138, lat: 25.118, side: 'l', dy: -6, compact: true },
  { name: 'Dubai Marina & JBR', lon: 55.14, lat: 25.08, side: 'l', dy: 12, compact: false },
  { name: 'Motor City', lon: 55.238, lat: 25.046, side: 'r', dy: 4, compact: false },
  { name: 'Dubai South & Expo', lon: 55.155, lat: 24.962, side: 'r', dy: 4, compact: true },
  { name: 'Jebel Ali', lon: 55.03, lat: 25.012, side: 'r', dy: 4, compact: true },
]

export interface Projected {
  x: number
  y: number
}

/** Longitude and latitude to a point in the 0 to 100 drawing, north up. */
export function project({ lon, lat }: ZonePoint): Projected {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 100,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100,
  }
}

/** A quadratic arc from the hub to the zone, bowed to one consistent side. */
export function arcPath(zone: ZonePoint): string {
  const h = project(HUB)
  const z = project(zone)
  const dx = z.x - h.x
  const dy = z.y - h.y
  const length = Math.hypot(dx, dy) || 1
  const cx = (h.x + z.x) / 2 + (-dy / length) * length * BOW
  const cy = (h.y + z.y) / 2 + (dx / length) * length * BOW

  return `M${h.x.toFixed(2)},${h.y.toFixed(2)} Q${cx.toFixed(2)},${cy.toFixed(2)} ${z.x.toFixed(2)},${z.y.toFixed(2)}`
}

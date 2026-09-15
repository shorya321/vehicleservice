/**
 * Geometry for the "Your account" sample route: DXB to Palm Jumeirah, drawn on
 * the hero's generated street map (components/home/hero/map-geometry.ts) so
 * the two maps are the same city. The route follows that map's own roads:
 * out of the airport onto the inland trunk, across a connector, west along
 * the coastal trunk, then up the access road to the Palm.
 *
 * Everything is computed once at module load from fixed inputs, so server and
 * client produce identical strings.
 */
import { TO_SEA_X, TO_SEA_Y, coastY, khailY, szrY } from '../hero/map-geometry'

export interface Point {
  x: number
  y: number
}

/** The slice of the hero map the card shows, in the hero map's own units. */
export const VIEW = { x: 240, y: 16, w: 1220, h: 800 } as const
export const VIEW_BOX = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`

const r1 = (n: number): string => n.toFixed(1)

/** Where a straight connector starting at `from` along `dir` meets `road`. */
function meet(from: Point, dir: Point, road: (x: number) => number): Point {
  let lo = 0
  let hi = 800
  const gap = (t: number): number => from.y + dir.y * t - road(from.x + dir.x * t)
  const below = gap(lo) > 0
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (gap(mid) > 0 === below) lo = mid
    else hi = mid
  }
  return { x: from.x + dir.x * lo, y: from.y + dir.y * lo }
}

function along(road: (x: number) => number, from: number, to: number, step: number): Point[] {
  const out: Point[] = []
  const dir = to > from ? 1 : -1
  for (let x = from; dir > 0 ? x < to : x > to; x += step * dir) out.push({ x, y: road(x) })
  return out
}

const SEA: Point = { x: TO_SEA_X, y: TO_SEA_Y }

/* Connector 1180 of the hero map's buildTrunks(), from the inland trunk. */
const CONNECTOR_X = 1180
const connectorStart: Point = { x: CONNECTOR_X, y: khailY(CONNECTOR_X) + 60 }
const onKhail = meet(connectorStart, SEA, khailY)
const onSzr = meet(connectorStart, SEA, szrY)

/* The Palm's trunk, run inland until it meets the coastal trunk. */
const PALM_BASE: Point = { x: 470, y: coastY(470) + 6 }
const accessOnSzr = meet(PALM_BASE, { x: -SEA.x, y: -SEA.y }, szrY)

export const PICKUP: Point = { x: 1340, y: 520 }
export const DROPOFF: Point = { x: PALM_BASE.x + SEA.x * 40, y: PALM_BASE.y + SEA.y * 40 }

const POINTS: readonly Point[] = [
  PICKUP,
  { x: 1296, y: khailY(1296) },
  ...along(khailY, 1280, onKhail.x, 20),
  onKhail,
  onSzr,
  ...along(szrY, onSzr.x - 20, accessOnSzr.x, 20),
  accessOnSzr,
  PALM_BASE,
  DROPOFF,
]

export const ROUTE_D = POINTS.map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)},${r1(p.y)}`).join('')

/** A point in the hero map's units as a percentage of the card's map box. */
export function toPercent({ x, y }: Point): Point {
  return { x: ((x - VIEW.x) / VIEW.w) * 100, y: ((y - VIEW.y) / VIEW.h) * 100 }
}

/**
 * Where the vehicle rests when motion is reduced: the point the given share
 * of the way along the route, with its heading in degrees.
 */
export function pointAlong(share: number): Point & { angle: number } {
  const lengths = POINTS.slice(1).map((p, i) => Math.hypot(p.x - POINTS[i].x, p.y - POINTS[i].y))
  let left = lengths.reduce((a, b) => a + b, 0) * share
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i]) {
      const a = POINTS[i]
      const b = POINTS[i + 1]
      const k = left / lengths[i]
      return {
        x: a.x + (b.x - a.x) * k,
        y: a.y + (b.y - a.y) * k,
        angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      }
    }
    left -= lengths[i]
  }
  const end = POINTS[POINTS.length - 1]
  return { ...end, angle: 0 }
}

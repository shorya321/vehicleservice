/**
 * Path data for the hero's street-map background: a stylised Dubai coast with
 * the Palm, the Creek, two trunk roads and the DXB runways. It is generated,
 * not traced, from a seeded PRNG so every render produces the same map.
 *
 * Computed once at module load. Anything that falls outside the visible
 * viewBox (or out at sea) is dropped here, which keeps the inline SVG small.
 */

const WORLD_W = 1600
const SLOPE = -0.42
const ANGLE_DEG = (Math.atan(SLOPE) * 180) / Math.PI
const ROTATE_CX = 800
const ROTATE_CY = 700
const CELL = 36

/* Visible window (matches VIEW_BOX) plus a margin for clipped edges. */
const BOUNDS = { minX: -120, maxX: 1720, minY: -80, maxY: 1000 }

/* Unit vector from the trunk towards the coast. */
export const TO_SEA_X = -0.387
export const TO_SEA_Y = -0.922

export const VIEW_BOX = '0 20 1600 880'

export interface HeroMapPaths {
  land: string
  coast: string
  parks: string
  blocks: string
  roads: string
  creek: string
  runways: string
  trunks: string
  palm: string
  fabricTransform: string
}

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const coastY = (x: number): number => 620 + SLOPE * x + 9 * Math.sin(x / 93) + 5 * Math.sin(x / 37)
export const szrY = (x: number): number => 770 + SLOPE * x + 3 * Math.sin(x / 140)
export const khailY = (x: number): number => 945 + SLOPE * x + 5 * Math.sin(x / 170)
const r1 = (n: number): string => n.toFixed(1)

function polyline(fn: (x: number) => number, from: number, to: number, step: number): string {
  let d = ''
  for (let x = from; x <= to; x += step) d += `${d ? 'L' : 'M'}${x},${r1(fn(x))}`
  return d
}

/* Fabric is drawn in a frame rotated to the coast; test cells in world space. */
function isVisible(localX: number, localY: number): boolean {
  const rad = (ANGLE_DEG * Math.PI) / 180
  const dx = localX - ROTATE_CX
  const dy = localY - ROTATE_CY
  const x = ROTATE_CX + dx * Math.cos(rad) - dy * Math.sin(rad)
  const y = ROTATE_CY + dx * Math.sin(rad) + dy * Math.cos(rad)
  if (x < BOUNDS.minX || x > BOUNDS.maxX || y < BOUNDS.minY || y > BOUNDS.maxY) return false
  return y > coastY(x) - 60
}

function buildFabric(seed: number): Pick<HeroMapPaths, 'parks' | 'blocks' | 'roads'> {
  const rand = mulberry32(seed)
  let parks = ''
  let blocks = ''
  let roads = ''

  // PRNG draw order must stay fixed, or the whole layout reshuffles.
  for (let i = -24; i < 70; i++) {
    for (let j = -22; j < 60; j++) {
      const bx = i * CELL
      const by = j * CELL
      const v = rand()
      if (v < 0.045) {
        const s = CELL * 2 - 8
        if (isVisible(bx + CELL, by + CELL)) parks += `M${bx + 4},${by + 4}h${s}v${s}h${-s}z`
      } else if (v < 0.47) {
        const w = CELL - 8 - ((rand() * 8) | 0)
        const h = CELL - 8 - ((rand() * 10) | 0)
        if (isVisible(bx + CELL / 2, by + CELL / 2)) blocks += `M${bx + 4},${by + 4}h${w}v${h}h${-w}z`
      }
    }
  }

  for (let c = -24; c < 70; c++) {
    const x = c * CELL
    let y = -22 * CELL
    while (y < 60 * CELL) {
      const len = CELL * (2 + ((rand() * 6) | 0))
      if (rand() > 0.2 && (isVisible(x, y) || isVisible(x, y + len))) roads += `M${x},${y}v${len}`
      y += len
    }
  }

  for (let row = -22; row < 60; row++) {
    const y = row * CELL
    let x = -24 * CELL
    while (x < 70 * CELL) {
      const len = CELL * (2 + ((rand() * 7) | 0))
      if (rand() > 0.24 && (isVisible(x, y) || isVisible(x + len, y))) roads += `M${x},${y}h${len}`
      x += len
    }
  }

  return { parks, blocks, roads }
}

function buildPalm(): string {
  const px = 470
  const py = coastY(470) + 6
  const trunk = 150
  let d = `M${px},${r1(py)} L${r1(px + TO_SEA_X * trunk)},${r1(py + TO_SEA_Y * trunk)}`
  const base = Math.atan2(TO_SEA_Y, TO_SEA_X)

  for (let f = 0; f < 8; f++) {
    const k = 0.28 + f * 0.09
    const fx = px + TO_SEA_X * trunk * k
    const fy = py + TO_SEA_Y * trunk * k
    const len = 52 - f * 2.5
    for (const side of [1, -1]) {
      const a = base + side * 1.05
      d += ` M${r1(fx)},${r1(fy)} l${r1(Math.cos(a) * len)},${r1(Math.sin(a) * len)}`
    }
  }

  const radius = 112
  const ccx = px + TO_SEA_X * 108
  const ccy = py + TO_SEA_Y * 108
  const a0 = base - 1.95
  const a1 = base + 1.95
  d += ` M${r1(ccx + Math.cos(a0) * radius)},${r1(ccy + Math.sin(a0) * radius)}`
  d += ` A${radius},${radius} 0 1 1 ${r1(ccx + Math.cos(a1) * radius)},${r1(ccy + Math.sin(a1) * radius)}`
  return d
}

function buildTrunks(): string {
  let d = polyline(szrY, -60, 1680, 20) + polyline(khailY, -60, 1680, 20)
  for (const x0 of [180, 520, 880, 1180]) {
    const y0 = khailY(x0) + 60
    d += `M${x0},${y0.toFixed(0)} L${(x0 + TO_SEA_X * 380).toFixed(0)},${(y0 + TO_SEA_Y * 380).toFixed(0)}`
  }
  return d
}

function buildHeroMap(seed: number): HeroMapPaths {
  let coast = `M-80,${r1(coastY(-80))}`
  for (let x = -80; x <= WORLD_W + 80; x += 10) coast += `L${x},${r1(coastY(x))}`

  return {
    land: `${coast}L${WORLD_W + 80},1480L-80,1480Z`,
    coast,
    ...buildFabric(seed),
    creek: 'M1205,140 C1250,205 1225,262 1292,300 S1386,316 1470,272 S1560,262 1640,300',
    runways: 'M1400,445 H1640 M1400,505 H1640',
    trunks: buildTrunks(),
    palm: buildPalm(),
    fabricTransform: `rotate(${ANGLE_DEG.toFixed(2)} ${ROTATE_CX} ${ROTATE_CY})`,
  }
}

export const HERO_MAP: HeroMapPaths = buildHeroMap(7)

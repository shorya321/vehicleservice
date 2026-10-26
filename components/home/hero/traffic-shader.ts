import { VIEW_BOX } from './map-geometry'

/**
 * Night traffic over the hero map: thin light trails along the street grid and
 * two-way traffic on the two trunk roads. Pure data and helpers only; the
 * WebGL loop lives in traffic-renderer.ts.
 *
 * The GLSL repeats map-geometry.ts on purpose (the fabric rotation, the 36-unit
 * grid, coastY, szrY, khailY). Change one and the trails leave the roads.
 */

/** Shader seconds per real second. Trails move 18 to 46 map units per shader second. */
export const TRAFFIC_SPEED = 0.9
export const TRAFFIC_MAX_DPR = 1.5
/** The still frame drawn for reduced motion: a moment with trails on screen. */
export const TRAFFIC_STILL_TIME = 7.3

export interface MapViewTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface TrafficStyle {
  color: [number, number, number]
  strength: number
}

const [, VIEW_Y, VIEW_W, VIEW_H] = VIEW_BOX.split(' ').map(Number)
export const MAP_VIEW_Y = VIEW_Y

/** Pixel box to map units, the way the SVG's `xMidYMid slice` places it. */
export function mapViewTransform(width: number, height: number): MapViewTransform {
  const scale = Math.max(width / VIEW_W, height / VIEW_H, 1e-6)
  return {
    scale,
    offsetX: (width - VIEW_W * scale) / 2,
    offsetY: (height - VIEW_H * scale) / 2,
  }
}

/** Reads `--hero-traffic-rgb` ("r, g, b") and `--hero-traffic-strength`. */
export function parseTrafficStyle(rgb: string, strength: string): TrafficStyle | null {
  const parts = rgb.split(',').map((part) => Number(part.trim()))
  const value = Number(strength.trim())
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n)) || strength.trim() === '') return null
  if (!Number.isFinite(value)) return null
  return {
    color: [parts[0] / 255, parts[1] / 255, parts[2] / 255],
    strength: Math.min(1, Math.max(0, value)),
  }
}

export const TRAFFIC_VERTEX = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'

export const TRAFFIC_FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform vec2 uOff;
uniform float uScale;
uniform float uViewY;
uniform float uTime;
uniform float uStrength;
uniform vec3 uCol;

float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float coastY(float x) { return 620. - .42 * x + 9. * sin(x / 93.) + 5. * sin(x / 37.); }
float szrY(float x) { return 770. - .42 * x + 3. * sin(x / 140.); }
float khailY(float x) { return 945. - .42 * x + 5. * sin(x / 170.); }

// One lane: a trail head with a fading tail, repeating every gap units.
float lane(float along, float id, float dens, float spMin, float spMax) {
  if (h1(id) > dens) return 0.;
  float dir = h1(id + 7.) > .5 ? 1. : -1.;
  float sp = mix(spMin, spMax, h1(id + 3.));
  float gap = mix(240., 620., h1(id + 11.));
  float q = mod(uTime * sp - along * dir + h1(id + 5.) * gap, gap);
  return exp(-q / 34.) + 1.6 * exp(-q * q / 3.);
}

// Undo the fabric's rotate(-22.78 800 700).
vec2 fabric(vec2 m) {
  float a = radians(22.78);
  vec2 d = m - vec2(800., 700.);
  return vec2(d.x * cos(a) - d.y * sin(a), d.x * sin(a) + d.y * cos(a)) + vec2(800., 700.);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 m = (px - uOff) / uScale + vec2(0., uViewY);
  float land = smoothstep(-6., 10., m.y - coastY(m.x));
  float px1 = 1. / uScale;

  vec2 g = fabric(m);
  vec2 c = g / 36.;
  vec2 r = floor(c + .5);
  vec2 d = (c - r) * 36.;
  float w = 1.1 + px1;
  float streets = exp(-d.y * d.y / (w * w)) * lane(g.x, r.y * 1.37 + 1., .42, 18., 40.)
                + exp(-d.x * d.x / (w * w)) * lane(g.y, r.x * 2.11 + 500., .42, 18., 40.);

  // Trunks run at slope -.42; .922 is cos(atan(.42)), the perpendicular distance.
  float a1 = m.x / .922;
  float ds = (m.y - szrY(m.x)) * .922;
  float dk = (m.y - khailY(m.x)) * .922;
  float ww = 1.5 + px1;
  float trunks = exp(-pow(ds - 2., 2.) / (ww * ww)) * lane(a1, 31., 1., 30., 46.)
               + exp(-pow(ds + 2., 2.) / (ww * ww)) * lane(-a1, 77., 1., 30., 46.)
               + exp(-pow(dk - 2., 2.) / (ww * ww)) * lane(a1 + 900., 53., 1., 26., 40.)
               + exp(-pow(dk + 2., 2.) / (ww * ww)) * lane(-a1, 91., 1., 26., 40.);
  float glow = exp(-ds * ds / 90.) * .05 + exp(-dk * dk / 90.) * .04;

  float a = clamp((streets * land * .75 + trunks * .95 + glow) * uStrength, 0., 1.);
  gl_FragColor = vec4(uCol * a, a);
}
`

import * as React from 'react'
import { HERO_MAP } from '../hero/map-geometry'
import { DROPOFF, PICKUP, ROUTE_D, VIEW_BOX, pointAlong, toPercent } from './route-geometry'

// `import * as React` is for jest: ts-jest compiles JSX with the classic
// runtime, which needs React in scope. Next itself uses the automatic runtime.

const ROUTE_ID = 'saved-route-path'
const LAND_CLIP_ID = 'saved-route-land'

/* One loop: wait at pickup, drive, wait at drop-off. The trail and the vehicle
   share these timings, so the gold line always ends under the car. */
const DUR = '9s'
const KEY_TIMES = '0;0.12;0.88;1'

const REST = pointAlong(0.58)

/**
 * The map inside the "Your account" route card. The city is the hero's street
 * map, cropped; the route and vehicle are drawn on top.
 *
 * Motion is SMIL, not React state, so reduced motion never changes the tree
 * shape: both the moving and the resting vehicle are always rendered and CSS
 * shows one (see `.saved-route` in app/globals.css).
 */
export function RouteMap(): React.JSX.Element {
  const m = HERO_MAP
  const pickup = toPercent(PICKUP)
  const dropoff = toPercent(DROPOFF)

  return (
    <div className="saved-route__map">
      <svg className="saved-route__svg" viewBox={VIEW_BOX} focusable="false" aria-hidden="true">
        <defs>
          <clipPath id={LAND_CLIP_ID}>
            <path d={m.land} />
          </clipPath>
          <path id={ROUTE_ID} d={ROUTE_D} pathLength={1} />
        </defs>

        <rect x="-200" y="-400" width="2000" height="2200" className="hero-map-water" />
        <path d={m.land} className="hero-map-land" />
        <g clipPath={`url(#${LAND_CLIP_ID})`}>
          <g transform={m.fabricTransform}>
            <path d={m.parks} className="hero-map-park" />
            <path d={m.blocks} className="hero-map-block" />
            <path d={m.roads} className="hero-map-road" />
          </g>
        </g>
        <g transform="rotate(-21 1500 470)">
          <path d={m.runways} className="hero-map-runway" />
        </g>
        <path d={m.trunks} className="hero-map-casing" />
        <path d={m.trunks} className="hero-map-major" />
        <path d={m.palm} className="hero-map-palm-edge" />
        <path d={m.palm} className="hero-map-palm" />
        <path d={m.coast} className="hero-map-coast" />

        <path d={ROUTE_D} className="saved-route__casing" />
        <path d={ROUTE_D} className="saved-route__ahead" />

        <g className="saved-route__moving">
          <path d={ROUTE_D} pathLength={1} className="saved-route__trail">
            <animate
              attributeName="stroke-dashoffset"
              values="1;1;0;0"
              keyTimes={KEY_TIMES}
              dur={DUR}
              repeatCount="indefinite"
            />
          </path>
          <g>
            <Vehicle />
            <animateMotion
              dur={DUR}
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="0;0;1;1"
              keyTimes={KEY_TIMES}
              calcMode="linear"
            >
              <mpath href={`#${ROUTE_ID}`} />
            </animateMotion>
          </g>
        </g>

        <g className="saved-route__resting">
          <path d={ROUTE_D} pathLength={1} className="saved-route__trail saved-route__trail--rest" />
          <g transform={`translate(${REST.x.toFixed(1)} ${REST.y.toFixed(1)}) rotate(${REST.angle.toFixed(1)})`}>
            <Vehicle />
          </g>
        </g>

        <circle cx={PICKUP.x} cy={PICKUP.y} r="11" className="saved-route__pin" />
        <circle cx={DROPOFF.x} cy={DROPOFF.y} r="20" className="saved-route__halo" />
        <circle cx={DROPOFF.x} cy={DROPOFF.y} r="11" className="saved-route__pin saved-route__pin--end" />
      </svg>

      <span className="saved-route__label saved-route__label--pickup" style={{ left: `${pickup.x}%`, top: `${pickup.y}%` }}>
        <b>DXB Terminal 3</b>
        <span className="numeric">25.2532° N, 55.3657° E</span>
      </span>
      <span className="saved-route__label saved-route__label--dropoff" style={{ left: `${dropoff.x}%`, top: `${dropoff.y}%` }}>
        <b>Palm Jumeirah</b>
        <span className="numeric">25.1124° N, 55.1390° E</span>
      </span>
    </div>
  )
}

/** Top-down car, nose along +x so `rotate="auto"` points it down the road. */
function Vehicle(): React.JSX.Element {
  return (
    <g className="saved-route__car">
      <circle r="44" className="saved-route__car-glow" />
      <rect x="-28" y="-15" width="56" height="30" rx="10" className="saved-route__car-body" />
      <rect x="3" y="-11" width="13" height="22" rx="4" className="saved-route__car-glass" />
      <rect x="-21" y="-11" width="10" height="22" rx="4" className="saved-route__car-glass" />
    </g>
  )
}

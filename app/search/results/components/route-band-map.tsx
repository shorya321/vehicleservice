import * as React from 'react'
import { HERO_MAP } from '@/components/home/hero/map-geometry'
import { projectRoute, VIEW_BOX, type GeoPoint } from './route-projection'

const LAND_CLIP_ID = 'route-band-map-land'

interface RouteBandMapProps {
  origin?: GeoPoint
  destination?: GeoPoint
}

/**
 * The street map behind the search page's route band.
 *
 * Deliberately the hero's map rather than a second one: same seeded geometry,
 * same `--hero-map-*` tokens, so the two flip with the theme together and a
 * visitor arriving from the home page sees the same cartography continue. What
 * makes it its own picture is the crop, a 1180-unit window against the hero's
 * 1600, so the fabric reads about a third larger here. The runways fall outside
 * that window entirely and are left out of the markup.
 *
 * Server-rendered on purpose. `HERO_MAP` builds its paths in a pair of nested
 * loops at module load and SearchResults is a client component, so this is
 * handed in as a slot instead of imported there. Imported, the whole build
 * would run in the browser on every search, and ~20KB of path data would join
 * the route's JS bundle.
 *
 * The trip is drawn from the two locations' real coordinates, placed by
 * route-projection.ts. Where it cannot place them - a zone pair, which has no
 * locations, or a route in another city - the line and pins are left out and
 * the map is plain background. Nothing is drawn from invented positions.
 */
export function RouteBandMap({ origin, destination }: RouteBandMapProps): React.JSX.Element {
  const m = HERO_MAP
  const trip = projectRoute(origin, destination)

  return (
    <div className="route-band__map" aria-hidden="true">
      <svg
        className="route-band__svg"
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <clipPath id={LAND_CLIP_ID}>
            <path d={m.land} />
          </clipPath>
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

        <path d={m.creek} className="hero-map-creek-edge" />
        <path d={m.creek} className="hero-map-creek" />

        <path d={m.trunks} className="hero-map-casing" />
        <path d={m.trunks} className="hero-map-major" />

        <path d={m.palm} className="hero-map-palm-edge" />
        <path d={m.palm} className="hero-map-palm" />

        <path d={m.coast} className="hero-map-coast" />

        {/* Inside the city svg, and therefore under `.route-band__fade`, which
            is the point: the trip belongs to the drawing. It surfaces where the
            wash thins and ghosts away behind the heading, rather than sitting on
            the band as a graphic laid over it. */}
        {trip && (
          <>
            {/* Casing keeps the line legible where it crosses a white trunk. */}
            <path d={trip.d} className="route-band__trip-casing" />
            <path d={trip.d} pathLength={1} className="route-band__trip-line" />

            <circle cx={trip.from.x} cy={trip.from.y} r="13" className="route-band__halo" />
            <circle cx={trip.from.x} cy={trip.from.y} r="5.5" className="route-band__pin" />

            <circle cx={trip.to.x} cy={trip.to.y} r="13" className="route-band__halo" />
            <circle cx={trip.to.x} cy={trip.to.y} r="5.5" className="route-band__pin" />
          </>
        )}
      </svg>

      <div className="route-band__fade" />
    </div>
  )
}

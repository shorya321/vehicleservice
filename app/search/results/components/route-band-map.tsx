import * as React from 'react'
import { HERO_MAP } from '@/components/home/hero/map-geometry'

const LAND_CLIP_ID = 'route-band-map-land'

/**
 * The window drawn, in the hero map's own units. `y` sits below the map's own
 * framing so the city's diagonal reads across the band rather than under it.
 */
const VIEW_BOX = '120 157 1180 560'

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
 * Texture only: no trip is drawn on it. That moved into the heading, as
 * `.route-connector`, because a line drawn here has to share this viewBox to
 * keep its pins on real features and a phone-width crop then loses both of
 * them. Saying it once, where it survives every width, beats saying it twice.
 */
export function RouteBandMap(): React.JSX.Element {
  const m = HERO_MAP

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

      </svg>

      <div className="route-band__fade" />
    </div>
  )
}

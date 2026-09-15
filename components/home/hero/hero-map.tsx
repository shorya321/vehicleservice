import { HERO_MAP, VIEW_BOX } from './map-geometry'

const LAND_CLIP_ID = 'hero-map-land'

/**
 * Decorative street map behind the hero. Server-rendered inline SVG so its
 * colours come from the theme tokens (--hero-map-*) and flip with dark mode.
 */
export function HeroMap(): React.JSX.Element {
  const m = HERO_MAP

  return (
    <div className="hero-map pointer-events-none absolute inset-0" aria-hidden="true">
      <svg
        className="hero-map-svg"
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

        <g transform="rotate(-21 1500 470)">
          <path d={m.runways} className="hero-map-runway" />
        </g>

        <path d={m.trunks} className="hero-map-casing" />
        <path d={m.trunks} className="hero-map-major" />

        <path d={m.palm} className="hero-map-palm-edge" />
        <path d={m.palm} className="hero-map-palm" />

        <path d={m.coast} className="hero-map-coast" />
      </svg>
      <div className="hero-map-fade absolute inset-0" />
    </div>
  )
}

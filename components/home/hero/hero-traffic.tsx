'use client'

import * as React from 'react'
import { mountTrafficCanvas } from './traffic-mount'
import { startTraffic } from './traffic-renderer'
import { HERO_MAP_VIEW, parseViewBox } from './traffic-shader'

interface HeroTrafficProps {
  /** viewBox of the SVG map underneath. Defaults to the hero's own window. */
  viewBox?: string
}

/**
 * Night-traffic shader over the hero map. The server renders an empty host,
 * so the hydrated tree matches and first paint is the map alone. The canvas
 * is created per mount (see traffic-mount.ts). Colour and strength come from
 * --hero-traffic-rgb / --hero-traffic-strength per theme.
 */
export function HeroTraffic({ viewBox }: HeroTrafficProps): React.JSX.Element {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const host = ref.current
    if (!host) return
    const view = viewBox ? parseViewBox(viewBox) : HERO_MAP_VIEW
    return mountTrafficCanvas(host, (canvas) => startTraffic(canvas, view))
  }, [viewBox])

  return <div ref={ref} className="hero-traffic-host" aria-hidden="true" />
}

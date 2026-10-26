'use client'

import { useEffect, useRef } from 'react'
import { startTraffic } from './traffic-renderer'

/**
 * Night-traffic shader over the hero map. The server renders an empty canvas,
 * so the hydrated tree matches and first paint is the map alone. Colour and
 * strength come from --hero-traffic-rgb / --hero-traffic-strength per theme.
 */
export function HeroTraffic(): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    return startTraffic(canvas)
  }, [])

  return <canvas ref={ref} className="hero-traffic" aria-hidden="true" />
}

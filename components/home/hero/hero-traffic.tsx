'use client'

import { useEffect, useRef } from 'react'
import { mountTrafficCanvas } from './traffic-mount'
import { startTraffic } from './traffic-renderer'

/**
 * Night-traffic shader over the hero map. The server renders an empty host,
 * so the hydrated tree matches and first paint is the map alone. The canvas
 * is created per mount (see traffic-mount.ts). Colour and strength come from
 * --hero-traffic-rgb / --hero-traffic-strength per theme.
 */
export function HeroTraffic(): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    return mountTrafficCanvas(host, startTraffic)
  }, [])

  return <div ref={ref} className="hero-traffic-host" aria-hidden="true" />
}

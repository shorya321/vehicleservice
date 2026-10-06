'use client'

import { useEffect, useState } from 'react'
import { formatBookingTime } from '@/lib/utils/timezone'

const TICK_MS = 30_000

/**
 * Current time in the operating timezone. Renders a placeholder on the server
 * and fills in after mount, so SSR and hydration never disagree on the minute.
 */
export function BoardClock() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = (): void => setTime(formatBookingTime(new Date()))
    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  return <span suppressHydrationWarning>{time ?? '--:--'}</span>
}

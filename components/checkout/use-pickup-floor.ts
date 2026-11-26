'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { customerPickupFloor, type PickupFloor } from '@/lib/trips/lead-time'

/** The floor moves with the clock; half a minute keeps it within one 5-minute slot. */
const TICK_MS = 30_000

function subscribe(onTick: () => void): () => void {
  const id = window.setInterval(onTick, TICK_MS)
  return () => window.clearInterval(id)
}

/**
 * The earliest pickup the checkout may offer, `now + leadMinutes` in the
 * operating timezone, or null while server rendering and hydrating (the server
 * clock must not decide what the browser greys out). Read through
 * `useSyncExternalStore` so it ticks without setting state inside an effect;
 * the snapshot is a `yyyy-MM-ddTHH:mm` string, so equal floors compare equal.
 */
export function usePickupFloor(leadMinutes: number): PickupFloor | null {
  const key = useSyncExternalStore(
    subscribe,
    () => {
      const floor = customerPickupFloor(new Date(), leadMinutes)
      return `${floor.date}T${floor.time}`
    },
    () => ''
  )
  return useMemo(() => {
    if (!key) return null
    const [date = '', time = ''] = key.split('T')
    return { date, time }
  }, [key])
}

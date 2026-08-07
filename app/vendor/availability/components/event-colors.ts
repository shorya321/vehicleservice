import type React from 'react'
import { CALENDAR_COLORS, isPastEvent } from '../types'
import type { CustomEvent } from './calendar-toolbar'

/**
 * Colour rule for a react-big-calendar event.
 *
 * Past events keep their type colour but recede, so history reads as history and
 * cannot be mistaken for something still actionable.
 */
export function eventStyleGetter(event: CustomEvent) {
  const past = isPastEvent(event)

  // Hatched + dashed for anything that does NOT hold its vehicle and driver:
  // pending offers, and cancelled bookings that are still in the future. Past
  // events are excluded because dimming already reads as history, and stacking
  // both treatments on them would be noise. This is the cue that stops a vendor
  // reading a released slot as busy.
  if (!event.occupies && !past) {
    return {
      className: 'rbc-event-unreserved',
      style: {
        backgroundColor: CALENDAR_COLORS.pendingFill,
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 5px, ${event.color ?? CALENDAR_COLORS.pendingBorder}33 5px, ${event.color ?? CALENDAR_COLORS.pendingBorder}33 10px)`,
        borderRadius: '5px',
        border: `2px dashed ${event.color ?? CALENDAR_COLORS.pendingBorder}`,
        color: CALENDAR_COLORS.pendingText,
        display: 'block',
      } satisfies React.CSSProperties,
    }
  }

  const style: React.CSSProperties = {
    backgroundColor: event.color || CALENDAR_COLORS.onlineUpcoming,
    borderRadius: '5px',
    opacity: past ? 0.6 : 0.9,
    color: 'white',
    border: '0px',
    display: 'block',
  }

  return { style }
}

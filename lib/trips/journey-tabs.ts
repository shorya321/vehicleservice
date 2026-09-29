import { legLabel } from './display'
import type { AdminTripGroup } from './admin-types'

export type JourneyState = 'assigned' | 'unassigned' | 'cancelled'

export interface JourneyTab {
  id: string
  label: string
  reference: string
  href: string
  current: boolean
  state: JourneyState
}

function labelFor(group: AdminTripGroup, legIndex: number): string {
  return (
    legLabel({ trip_type: group.trip_type, leg_index: legIndex }, group.leg_count) ??
    `Journey ${legIndex + 1}`
  )
}

/**
 * One tab per journey of a round trip or multi-city order, for the admin
 * booking page: which journey is on screen and which still needs a vendor.
 */
export function journeyTabs(group: AdminTripGroup, currentBookingId: string): JourneyTab[] {
  return group.legs.map((leg) => ({
    id: leg.id,
    label: labelFor(group, leg.leg_index),
    reference: leg.trip_number || leg.booking_number,
    href: `/admin/bookings/${leg.id}`,
    current: leg.id === currentBookingId,
    state:
      leg.booking_status === 'cancelled'
        ? 'cancelled'
        : leg.assignment_status
          ? 'assigned'
          : 'unassigned',
  }))
}

/** "Return", "Journey 2 of 3": the journey this booking page shows, or null. */
export function viewingJourney(group: AdminTripGroup, currentBookingId: string): string | null {
  const leg = group.legs.find((l) => l.id === currentBookingId)
  return leg ? labelFor(group, leg.leg_index) : null
}

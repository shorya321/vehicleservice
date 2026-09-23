'use client'

import type { MouseEvent, ReactNode } from 'react'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import { legLabel } from '@/lib/trips/display'
import type { BookingWithCustomer } from '../actions'
import { activeAssignmentOf } from './trip-group-row'

interface TripJourneysPanelProps {
  legs: BookingWithCustomer[]
  legCount: number
  expanded: boolean
  colSpan: number
  /** False while a confirm dialog is open, so a click inside it does not navigate. */
  canNavigate: () => boolean
  onOpenJourney: (bookingId: string) => void
  renderMenu: (leg: BookingWithCustomer) => ReactNode
  statusBadge: (status: string) => ReactNode
  assignmentBadge: (status?: string | null) => ReactNode
}

/**
 * The journeys of one trip, sliding open inside the trip's own row. They read as parts of
 * one order rather than as extra bookings in the list, and each keeps its own actions menu.
 */
export function TripJourneysPanel({
  legs,
  legCount,
  expanded,
  colSpan,
  canNavigate,
  onOpenJourney,
  renderMenu,
  statusBadge,
  assignmentBadge,
}: TripJourneysPanelProps) {
  const handleClick = (e: MouseEvent, bookingId: string) => {
    const el = e.target as HTMLElement
    if (
      el.closest('.no-row-click') ||
      el.closest('[role="menuitem"]') ||
      el.closest('[role="alertdialog"]') ||
      !canNavigate()
    ) {
      return
    }
    onOpenJourney(bookingId)
  }

  return (
    <TableRow className={cn('hover:bg-transparent', !expanded && 'border-0')}>
      <TableCell colSpan={colSpan} className="p-0">
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
          inert={!expanded}
          aria-hidden={!expanded}
        >
          <div className="overflow-hidden">
            <ol className="mb-4 ml-[62px] mr-4 divide-y rounded-md border bg-muted/30">
              {legs.map((leg) => {
                const assignment = activeAssignmentOf(leg)
                return (
                  <li
                    key={leg.id}
                    className="flex cursor-pointer items-center gap-4 px-4 py-3 text-sm hover:bg-muted/50"
                    onClick={(e) => handleClick(e, leg.id)}
                  >
                    <div className="w-[150px] flex-shrink-0">
                      <div className="font-medium">{legLabel(leg, legCount)}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {leg.trip_number || leg.booking_number}
                      </div>
                    </div>
                    <div className="w-[110px] flex-shrink-0">
                      <div>{format(toBookingTz(leg.pickup_datetime), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(toBookingTz(leg.pickup_datetime), 'HH:mm')}
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate" title={leg.pickup_address}>{leg.pickup_address}</span>
                      <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <span className="truncate" title={leg.dropoff_address}>{leg.dropoff_address}</span>
                    </div>
                    <div className="w-[170px] flex-shrink-0">
                      {assignment ? (
                        <div className="space-y-1">
                          <div className="truncate">{assignment.vendor?.business_name || 'Unknown Vendor'}</div>
                          {assignmentBadge(assignment.status)}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">Unassigned</Badge>
                      )}
                    </div>
                    <div className="w-[100px] flex-shrink-0">{statusBadge(leg.booking_status)}</div>
                    <div className="w-[90px] flex-shrink-0 text-right font-semibold">
                      {formatCurrency(leg.total_price)}
                    </div>
                    <div className="no-row-click flex-shrink-0">{renderMenu(leg)}</div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </TableCell>
    </TableRow>
  )
}

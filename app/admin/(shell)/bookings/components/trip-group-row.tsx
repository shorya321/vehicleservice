'use client'

import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { Building2, Calendar, ChevronDown, ChevronRight, Eye, MapPin, MoreHorizontal, User, UserPlus } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatCurrency } from '@/lib/utils'
import { toBookingTz } from '@/lib/utils/timezone'
import { tripTypeLabel } from '@/lib/trips/display'
import type { BookingWithCustomer } from '../actions'

const ACTIVE_ASSIGNMENT = ['pending', 'accepted', 'completed']

/** The journey's current vendor assignment, if it has one. */
export function activeAssignmentOf(leg: BookingWithCustomer) {
  return leg.booking_assignments?.find((a) => ACTIVE_ASSIGNMENT.includes(a.status))
}

/** Journeys of the trip, other than `bookingId`, that still need a vendor. Same rule as the detail page. */
export function unassignedOtherLegIds(legs: BookingWithCustomer[], bookingId: string): string[] {
  return legs
    .filter((leg) => leg.id !== bookingId && leg.booking_status !== 'cancelled' && !activeAssignmentOf(leg))
    .map((leg) => leg.id)
}

interface TripGroupRowProps {
  row: BookingWithCustomer
  legs: BookingWithCustomer[]
  groupNumber: string
  expanded: boolean
  selected: boolean | 'indeterminate'
  onToggle: () => void
  onSelect: (checked: boolean) => void
  onOpen: () => void
  /** Assign the journeys that still need a vendor. Absent when every journey has one (reassign per journey). */
  onAssign?: () => void
  statusBadge: (status: string) => ReactNode
  paymentBadge: (status: string) => ReactNode
}

function VendorSummary({ legs }: { legs: BookingWithCustomer[] }) {
  const vendors = legs.map((leg) => activeAssignmentOf(leg)?.vendor?.business_name ?? null)
  const assigned = vendors.filter(Boolean).length

  if (assigned === 0) {
    return <Badge variant="outline" className="text-xs">Unassigned</Badge>
  }

  const sameVendor = assigned === legs.length && new Set(vendors).size === 1
  return (
    <div className="flex items-start gap-2 max-w-[200px]">
      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0 space-y-1">
        {sameVendor && (
          <div className="font-medium text-sm truncate" title={vendors[0] ?? undefined}>
            {vendors[0]}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {sameVendor ? `All ${legs.length} journeys` : `${assigned} of ${legs.length} assigned`}
        </div>
      </div>
    </div>
  )
}

/** One list row standing for a whole round trip or multi-city order. Its journeys render below it when expanded. */
export function TripGroupRow({
  row,
  legs,
  groupNumber,
  expanded,
  selected,
  onToggle,
  onSelect,
  onOpen,
  onAssign,
  statusBadge,
  paymentBadge,
}: TripGroupRowProps) {
  const first = legs[0]
  const last = legs[legs.length - 1]
  const statuses = new Set(legs.map((leg) => leg.booking_status))
  const total = legs.reduce((sum, leg) => sum + (Number(leg.total_price) || 0), 0)
  const legCount = row.booking_group?.leg_count ?? legs.length
  const Chevron = expanded ? ChevronDown : ChevronRight

  return (
    <TableRow
      className={cn('cursor-pointer', expanded && 'border-b-0')}
      onClick={(e) => {
        const el = e.target as HTMLElement
        if (el.closest('.no-row-click') || el.closest('[role="menuitem"]')) return
        onOpen()
      }}
    >
      <TableCell className="no-row-click">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(checked === true)}
          aria-label={`Select trip ${groupNumber}`}
        />
      </TableCell>
      <TableCell className="font-mono text-sm">
        <button
          type="button"
          className="no-row-click flex items-center gap-1 text-left hover:underline"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Hide' : 'Show'} journeys of ${groupNumber}`}
        >
          <Chevron className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span>{groupNumber}</span>
        </button>
        <div className="pl-5 text-xs text-muted-foreground font-sans whitespace-nowrap">
          {legs.length === legCount ? `${legCount} journeys` : `${legs.length} of ${legCount} journeys shown`}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <Badge variant="outline" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Customer
          </Badge>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {tripTypeLabel(row)}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{format(toBookingTz(first.pickup_datetime), 'MMM dd, yyyy')}</div>
            <div className="text-muted-foreground">
              {format(toBookingTz(first.pickup_datetime), 'HH:mm')}
              {legs.length > 1 && ` to ${format(toBookingTz(last.pickup_datetime), 'MMM dd')}`}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-sm max-w-xs">
          <div className="flex items-start gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="truncate">{first.pickup_address}</span>
          </div>
          <div className="flex items-start gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <span className="truncate">{last.dropoff_address}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <VendorSummary legs={legs} />
      </TableCell>
      <TableCell>
        {statuses.size === 1 ? statusBadge(first.booking_status) : <Badge variant="outline">Mixed</Badge>}
      </TableCell>
      <TableCell>{paymentBadge(first.payment_status)}</TableCell>
      <TableCell className="text-right font-semibold">{formatCurrency(total)}</TableCell>
      <TableCell className="text-right no-row-click">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Trip {groupNumber}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onOpen}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {onAssign && (
              <DropdownMenuItem onClick={onAssign}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Vendor
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onToggle}>
              <Chevron className="mr-2 h-4 w-4" />
              {expanded ? 'Hide journeys' : 'Show journeys'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Reassign, status, payment and delete are per journey
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

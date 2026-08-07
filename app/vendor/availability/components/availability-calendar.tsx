'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, momentLocalizer, View, SlotInfo, ToolbarProps } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-styles.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { markResourceUnavailable, removeUnavailability, getVendorCalendarEvents } from '../actions'
import {
  CALENDAR_COLORS,
  isPastEvent,
  isReleased,
  type CalendarDriver,
  type CalendarEvent,
  type CalendarEventSource,
  type CalendarVehicle,
} from '../types'
import { EventDetailsDialog } from './event-details-dialog'
import { CalendarLegend } from './calendar-legend'
import { FleetTimeline } from './fleet-timeline'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import { Car, User, AlertCircle, CalendarDays, LayoutList } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const localizer = momentLocalizer(moment)

interface AvailabilityCalendarProps {
  initialEvents: CalendarEvent[]
  vehicles: CalendarVehicle[]
  drivers: CalendarDriver[]
}

/** The server sends `start`/`end` as serialized dates; the client rehydrates them.
 *  react-big-calendar is generic over the event type and only needs the accessors
 *  named below, so this does not extend its own `Event` interface (whose optional
 *  ReactNode `title` conflicts with our required string). */
interface CustomEvent extends Omit<CalendarEvent, 'start' | 'end'> {
  start: Date
  end: Date
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => moment().month(i).format('MMMM'))

// Mirrors the SelectTrigger look (border-border, neutral text, h-9, normal case) so
// the nav/view buttons match the Month/Year dropdowns instead of the gold outline.
const TOOLBAR_BTN = 'inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50'

/** Custom toolbar: keeps RBC's Today/Back/Next + view buttons, and adds Month/Year
 *  dropdowns that jump straight to any month via the navigate.DATE action. */
function CalendarToolbar({ date, view, views, onNavigate, onView }: ToolbarProps<CustomEvent, object>) {
  const currentMonth = date.getMonth()
  const currentYear = date.getFullYear()

  // A ±5-year window, widened to always include whatever year is on screen.
  const thisYear = new Date().getFullYear()
  const years = (() => {
    const start = Math.min(thisYear - 5, currentYear)
    const end = Math.max(thisYear + 5, currentYear)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })()

  const jumpTo = (month: number, year: number) => {
    onNavigate('DATE', new Date(year, month, 1))
  }

  const viewNames = Array.isArray(views) ? (views as View[]) : []

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={TOOLBAR_BTN} onClick={() => onNavigate('TODAY')}>Today</button>
        <button type="button" className={TOOLBAR_BTN} onClick={() => onNavigate('PREV')}>Back</button>
        <button type="button" className={TOOLBAR_BTN} onClick={() => onNavigate('NEXT')}>Next</button>

        <Select value={String(currentMonth)} onValueChange={(v) => jumpTo(Number(v), currentYear)}>
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_LABELS.map((label, i) => (
              <SelectItem key={label} value={String(i)}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(currentYear)} onValueChange={(v) => jumpTo(currentMonth, Number(v))}>
          <SelectTrigger className="h-9 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {viewNames.map((name) => (
          <button
            key={name}
            type="button"
            className={cn(TOOLBAR_BTN, view === name && 'bg-accent text-accent-foreground')}
            onClick={() => onView(name)}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AvailabilityCalendar({
  initialEvents,
  vehicles,
  drivers
}: AvailabilityCalendarProps) {
  const [events, setEvents] = useState<CustomEvent[]>(
    initialEvents.map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end)
    }))
  )
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'vehicle' | 'driver'>('all')
  const [selectedResourceFilter, setSelectedResourceFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | CalendarEventSource>('all')
  const [showReleased, setShowReleased] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // The fleet timeline is not a react-big-calendar view (RBC's own `resources` are
  // day-only vertical columns), so it lives behind a mode switch rather than being
  // registered as a fourth view. The RBC views keep working untouched.
  const [mode, setMode] = useState<'calendar' | 'fleet'>('calendar')
  const [fleetSpan, setFleetSpan] = useState<'day' | 'week'>('day')

  // Switching the resource-type tab must clear the chosen resource. Without this,
  // picking a vehicle then switching to Drivers leaves a vehicle id filtering the
  // list while the Select renders a value absent from its own options, and the
  // calendar silently empties. Done in the handler rather than an effect so it
  // does not also fire on mount.
  const handleFilterTypeChange = useCallback((next: 'all' | 'vehicle' | 'driver') => {
    setFilterType(next)
    setSelectedResourceFilter('all')
  }, [])

  // Fleet lanes. `is_available` / `is_active` are standing flags rather than a
  // time window, so they render as a persistent band across the lane instead of a
  // bar, with the same wording the direct-booking form uses for them.
  const timelineVehicles = useMemo(
    () =>
      vehicles.map((v) => ({
        id: v.id,
        label: `${v.make ?? ''} ${v.model ?? ''}`.trim() || 'Vehicle',
        sublabel: v.registration_number ?? undefined,
        outOfService: v.is_available === false ? 'Marked out of service' : undefined,
      })),
    [vehicles]
  )

  const timelineDrivers = useMemo(
    () =>
      drivers.map((d) => ({
        id: d.id,
        label: `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || 'Driver',
        sublabel: d.phone ?? undefined,
        outOfService: d.is_active === false ? 'Inactive' : undefined,
      })),
    [drivers]
  )

  // True when the whole visible range has already elapsed.
  const isViewingPast = useMemo(() => {
    const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day'
    return moment(date).endOf(unit).toDate() < startOfBookingDayUtc()
  }, [date, view])

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Filter by resource type. A booking occupies a vehicle *and* a driver, so it
    // belongs to a tab only if it actually has a resource of that kind assigned,
    // matching on `type === 'booking'` alone would let every booking through both.
    if (filterType === 'vehicle') {
      filtered = filtered.filter(e =>
        e.type === 'booking' ? !!e.vehicleId : e.resourceType === 'vehicle'
      )
    } else if (filterType === 'driver') {
      filtered = filtered.filter(e =>
        e.type === 'booking' ? !!e.driverId : e.resourceType === 'driver'
      )
    }

    // Filter by where the occupancy came from.
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(e => e.source === sourceFilter)
    }

    // Completed and cancelled trips hold nothing, so they are history rather than
    // schedule. Keyed off status, not `!occupies`: pending offers are also
    // non-occupying and a switch labelled "completed & cancelled" must never hide
    // work the vendor still owes an answer on.
    if (!showReleased) {
      filtered = filtered.filter(e => !isReleased(e))
    }

    // Filter by specific resource
    if (selectedResourceFilter !== 'all') {
      filtered = filtered.filter(e =>
        e.type === 'booking'
          ? e.vehicleId === selectedResourceFilter || e.driverId === selectedResourceFilter
          : e.resourceId === selectedResourceFilter
      )
    }

    return filtered
  }, [events, filterType, selectedResourceFilter, sourceFilter, showReleased])

  // Fetch events for the range currently on screen. Every refresh path must go
  // through this: calling getVendorCalendarEvents() with no range loads the
  // vendor's entire unbounded history into the current view.
  const refetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      // The fleet view draws its own Dubai-anchored window, which can reach past
      // the calendar unit's edges, so widen the fetch by a day on each side rather
      // than letting a bar be silently dropped at the boundary.
      const unit = mode === 'fleet'
        ? (fleetSpan === 'week' ? 'week' : 'day')
        : view === 'month' ? 'month' : view === 'week' ? 'week' : 'day'

      const pad = mode === 'fleet' ? 1 : 0
      const startDate = moment(date).startOf(unit).subtract(pad, 'day').toDate()
      const endDate = moment(date).endOf(unit).add(pad, 'day').toDate()

      const newEvents = await getVendorCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      )

      setEvents(newEvents.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      })))
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load calendar events')
    } finally {
      setIsLoading(false)
    }
  }, [date, view, mode, fleetSpan])

  // Refetch events when date or view changes
  useEffect(() => {
    refetchEvents()
  }, [refetchEvents])

  // Custom event style. Past events keep their type colour but recede, so history
  // reads as history and cannot be mistaken for something still actionable.
  const eventStyleGetter = useCallback((event: CustomEvent) => {
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
      display: 'block'
    }

    return { style }
  }, [])

  // Handle event click
  const handleSelectEvent = useCallback((event: CustomEvent) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
  }, [])

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate)
  }, [])

  // Handle slot selection (for creating unavailability)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    // Courtesy guard only. markResourceUnavailable rejects past dates server-side,
    // which is what actually prevents backdating. Uses the same Dubai boundary as
    // the server so the UI never offers a slot the server will refuse.
    if (slotInfo.start < startOfBookingDayUtc()) {
      toast.info('Cannot mark unavailability for a past date', {
        description: 'Availability can only be blocked from today onwards'
      })
      return
    }

    setSelectedSlot(slotInfo)
    setShowUnavailableDialog(true)
  }, [])

  // Handle creating unavailability
  const handleCreateUnavailability = async (data: {
    resourceId: string
    resourceType: 'vehicle' | 'driver'
    reason: string
    notes?: string
  }) => {
    if (!selectedSlot) return

    try {
      await markResourceUnavailable(
        data.resourceId,
        data.resourceType,
        selectedSlot.start.toISOString(),
        selectedSlot.end.toISOString(),
        data.reason,
        data.notes
      )

      await refetchEvents()

      toast.success('Resource marked as unavailable')
      setShowUnavailableDialog(false)
      setSelectedSlot(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark resource as unavailable')
    }
  }

  // Handle removing unavailability
  const handleRemoveUnavailability = async () => {
    if (!selectedEvent || selectedEvent.type !== 'unavailable') return

    try {
      await removeUnavailability(selectedEvent.id)

      await refetchEvents()

      toast.success('Unavailability removed')
      setShowEventDialog(false)
      setSelectedEvent(null)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove unavailability')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label>View</Label>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'calendar' | 'fleet')}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="fleet">
                <LayoutList className="h-4 w-4 mr-2" />
                Fleet
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Label>Resource Type</Label>
          <Tabs value={filterType} onValueChange={(v) => handleFilterTypeChange(v as 'all' | 'vehicle' | 'driver')}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="vehicle">
                <Car className="h-4 w-4 mr-2" />
                Vehicles
              </TabsTrigger>
              <TabsTrigger value="driver">
                <User className="h-4 w-4 mr-2" />
                Drivers
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filterType !== 'all' && (
          <div className="space-y-2">
            <Label>Select {filterType === 'vehicle' ? 'Vehicle' : 'Driver'}</Label>
            <Select value={selectedResourceFilter} onValueChange={setSelectedResourceFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filterType === 'vehicle' ? 'Vehicles' : 'Drivers'}</SelectItem>
                {filterType === 'vehicle'
                  ? vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registration_number})
                      </SelectItem>
                    ))
                  : drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Booking Source</Label>
          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as 'all' | CalendarEventSource)}
          >
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="online">Online bookings</SelectItem>
              <SelectItem value="offline">Offline bookings</SelectItem>
              <SelectItem value="blocked">Blocked periods</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pb-2 ml-auto">
          <Switch
            id="show-released"
            checked={showReleased}
            onCheckedChange={setShowReleased}
          />
          <Label htmlFor="show-released" className="cursor-pointer font-normal">
            Show completed &amp; cancelled
          </Label>
        </div>
      </div>

      <CalendarLegend />

      {/* Viewing a period that has already elapsed. Past bookings and unavailability
          are historical and read-only here. Full details live on the Bookings page. */}
      {isViewingPast && (
        <div className="flex items-start gap-2 rounded-lg border border-muted bg-muted/50 p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            You&apos;re viewing past dates. Bookings and unavailability shown here are historical and
            read-only. For full booking records see{' '}
            <Link href="/vendor/bookings" className="font-medium underline underline-offset-4">
              Bookings
            </Link>
            .
          </p>
        </div>
      )}

      {/* Calendar / Fleet */}
      <div
        className={cn(
          'bg-background rounded-lg p-4 border relative',
          mode === 'calendar' && 'h-[600px]'
        )}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading events...</span>
            </div>
          </div>
        )}

        {mode === 'calendar' ? (
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            components={{ toolbar: CalendarToolbar }}
            className="vendor-calendar"
          />
        ) : (
          <div className="space-y-4">
            {/* The fleet view is outside react-big-calendar, so it carries its own
                navigation rather than borrowing the RBC toolbar. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" className={TOOLBAR_BTN} onClick={() => setDate(new Date())}>
                  Today
                </button>
                <button
                  type="button"
                  className={TOOLBAR_BTN}
                  onClick={() => setDate(moment(date).subtract(1, fleetSpan).toDate())}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={TOOLBAR_BTN}
                  onClick={() => setDate(moment(date).add(1, fleetSpan).toDate())}
                >
                  Next
                </button>
              </div>

              <Tabs value={fleetSpan} onValueChange={(v) => setFleetSpan(v as 'day' | 'week')}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <FleetTimeline
              events={filteredEvents}
              vehicles={timelineVehicles}
              drivers={timelineDrivers}
              date={date}
              span={fleetSpan}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        )}
      </div>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={selectedEvent}
        onRemoveUnavailability={handleRemoveUnavailability}
      />

      {/* Create Unavailability Dialog */}
      <UnavailabilityDialog
        open={showUnavailableDialog}
        onOpenChange={setShowUnavailableDialog}
        vehicles={vehicles}
        drivers={drivers}
        onSubmit={handleCreateUnavailability}
        slot={selectedSlot}
      />
    </div>
  )
}

interface UnavailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: any[]
  drivers: any[]
  onSubmit: (data: any) => void
  slot: SlotInfo | null
}

function UnavailabilityDialog({
  open,
  onOpenChange,
  vehicles,
  drivers,
  onSubmit,
  slot
}: UnavailabilityDialogProps) {
  const [resourceType, setResourceType] = useState<'vehicle' | 'driver'>('vehicle')
  const [resourceId, setResourceId] = useState('')
  const [reason, setReason] = useState('maintenance')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    if (!resourceId) {
      toast.error('Please select a resource')
      return
    }

    onSubmit({
      resourceId,
      resourceType,
      reason,
      notes: notes || undefined
    })

    // Reset form
    setResourceId('')
    setReason('maintenance')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Resource as Unavailable</DialogTitle>
          <DialogDescription>
            Select a resource and reason for unavailability
            {slot && (
              <span className="block mt-2 text-sm">
                Period: {moment(slot.start).format('MMM DD, YYYY')} - {moment(slot.end).format('MMM DD, YYYY')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Resource Type</Label>
            <Select value={resourceType} onValueChange={(v: any) => {
              setResourceType(v)
              setResourceId('')
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select {resourceType === 'vehicle' ? 'Vehicle' : 'Driver'}</Label>
            <Select value={resourceId} onValueChange={setResourceId}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${resourceType}...`} />
              </SelectTrigger>
              <SelectContent>
                {resourceType === 'vehicle'
                  ? vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registration_number})
                      </SelectItem>
                    ))
                  : drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}
                      </SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resourceType === 'vehicle' ? (
                  <>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            Mark as Unavailable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Calendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-styles.css'
import { toast } from 'sonner'
import { markResourceUnavailable, removeUnavailability, getVendorCalendarEvents } from '../actions'
import {
  type CalendarDriver,
  type CalendarEvent,
  type CalendarVehicle,
} from '../types'
import { EventDetailsDialog } from './event-details-dialog'
import { CalendarLegend } from './calendar-legend'
import { FleetTimeline } from './fleet-timeline'
import { ConflictBanner } from './conflict-banner'
import { CalendarFilters } from './calendar-filters'
import { CalendarToolbar, MonthYearJump, TOOLBAR_BTN, type CustomEvent } from './calendar-toolbar'
import { UnavailabilityDialog, type UnavailabilitySubmission } from './unavailability-dialog'
import { eventStyleGetter } from './event-colors'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import { useMediaQuery } from '@/lib/hooks/use-media-query'
import { fromDisplayDate, toDisplayDate } from '@/lib/availability/display-tz'
import {
  filterCalendarEvents,
  filterResources,
  type ResourceTypeFilter,
  type SourceFilter,
} from '@/lib/availability/filters'
import { conflictsByResource, findResourceConflicts } from '@/lib/availability/conflicts'
import { FLEET_SPANS, type FleetSpan } from '@/lib/availability/timeline'
import { AlertCircle, CalendarOff } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const localizer = momentLocalizer(moment)

/** Week and Day open here rather than at midnight. The grid is not clamped:
 *  overnight trips exist, and a `min`/`max` window would hide them outright. */
const SCROLL_TO_TIME = new Date(1970, 0, 1, 7, 0, 0)

interface AvailabilityCalendarProps {
  initialEvents: CalendarEvent[]
  vehicles: CalendarVehicle[]
  drivers: CalendarDriver[]
}

export function AvailabilityCalendar({
  initialEvents,
  vehicles,
  drivers,
}: AvailabilityCalendarProps) {
  const [events, setEvents] = useState<CustomEvent[]>(
    initialEvents.map(e => ({
      ...e,
      start: new Date(e.start),
      end: new Date(e.end),
    }))
  )
  // A month grid on a phone is seven columns of unreadable chips, so Day is the
  // default there. Null until the vendor picks a view, so the default can follow
  // the viewport without an effect racing the state on every resize.
  const isSmallScreen = useMediaQuery('(max-width: 640px)')
  const [chosenView, setChosenView] = useState<View | null>(null)
  const view = chosenView ?? (isSmallScreen ? 'day' : 'month')
  const setView = setChosenView
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false)
  /** The true instants behind a slot drag, already un-shifted out of RBC's display timezone. */
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: Date; end: Date } | null>(null)
  const [filterType, setFilterType] = useState<ResourceTypeFilter>('all')
  const [selectedResourceFilter, setSelectedResourceFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [showReleased, setShowReleased] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // The fleet timeline is not a react-big-calendar view (RBC's own `resources` are
  // day-only vertical columns), so it lives behind a mode switch rather than being
  // registered as a fourth view. The RBC views keep working untouched.
  const [mode, setMode] = useState<'calendar' | 'fleet'>('calendar')
  const [fleetSpan, setFleetSpan] = useState<FleetSpan>('day')

  // Switching the resource-type tab must clear the chosen resource. Without this,
  // picking a vehicle then switching to Drivers leaves a vehicle id filtering the
  // list while the Select renders a value absent from its own options, and the
  // calendar silently empties. Done in the handler rather than an effect so it
  // does not also fire on mount.
  const handleFilterTypeChange = useCallback((next: ResourceTypeFilter) => {
    setFilterType(next)
    setSelectedResourceFilter('all')
  }, [])

  // Fleet lanes. `is_available` / `is_active` are standing flags rather than a
  // time window, so they render as a persistent band across the lane instead of a
  // bar, with the same wording the direct-booking form uses for them.
  //
  // Filtered by the same rules as the events: lanes built from the raw props left
  // "Resource Type: Vehicles" rendering every driver row with its bookings intact.
  const timelineVehicles = useMemo(
    () =>
      filterResources(vehicles, 'vehicle', { filterType, selectedResourceFilter }).map((v) => ({
        id: v.id,
        label: `${v.make ?? ''} ${v.model ?? ''}`.trim() || 'Vehicle',
        sublabel: v.registration_number ?? undefined,
        outOfService: v.is_available === false ? 'Marked out of service' : undefined,
      })),
    [vehicles, filterType, selectedResourceFilter]
  )

  const timelineDrivers = useMemo(
    () =>
      filterResources(drivers, 'driver', { filterType, selectedResourceFilter }).map((d) => ({
        id: d.id,
        label: `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || 'Driver',
        sublabel: d.phone ?? undefined,
        outOfService: d.is_active === false ? 'Inactive' : undefined,
      })),
    [drivers, filterType, selectedResourceFilter]
  )

  // True when the whole visible range has already elapsed. Keyed off whichever
  // span is actually on screen: in fleet mode `view` still holds the RBC value,
  // so reading it there judged a month the vendor is not looking at.
  const isViewingPast = useMemo(() => {
    const unit = mode === 'fleet'
      ? (fleetSpan === 'week' ? 'week' : 'day')
      : view === 'month' ? 'month' : view === 'week' ? 'week' : 'day'
    const end = mode === 'fleet' && fleetSpan === '3day'
      ? moment(date).add(2, 'day').endOf('day')
      : moment(date).endOf(unit)
    return end.toDate() < startOfBookingDayUtc()
  }, [date, view, mode, fleetSpan])

  const filteredEvents = useMemo(
    () =>
      filterCalendarEvents(events, {
        filterType,
        selectedResourceFilter,
        sourceFilter,
        showReleased,
      }),
    [events, filterType, selectedResourceFilter, sourceFilter, showReleased]
  )

  // Double bookings across the visible fleet. Computed over the filtered set so a
  // lane the vendor cannot see never contributes a warning they cannot act on.
  const conflicts = useMemo(
    () =>
      findResourceConflicts(filteredEvents, [
        ...timelineVehicles.map((v) => ({ id: v.id, label: v.label, kind: 'vehicle' as const })),
        ...timelineDrivers.map((d) => ({ id: d.id, label: d.label, kind: 'driver' as const })),
      ]),
    [filteredEvents, timelineVehicles, timelineDrivers]
  )

  const conflictsPerResource = useMemo(() => conflictsByResource(conflicts), [conflicts])

  // React-big-calendar positions events by reading `Date.getHours()`, which is the
  // browser's clock. Shifting the dates here is what makes the grid agree with the
  // Fleet bars and the details dialog, both of which format in Dubai time. Only
  // RBC sees these; everything else keeps working in real instants.
  const displayEvents = useMemo(
    () =>
      filteredEvents.map((e) => ({
        ...e,
        start: toDisplayDate(e.start),
        end: toDisplayDate(e.end),
      })),
    [filteredEvents]
  )

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
      const trailing = mode === 'fleet' && fleetSpan === '3day' ? 2 : 0
      const startDate = moment(date).startOf(unit).subtract(pad, 'day').toDate()
      const endDate = moment(date).endOf(unit).add(pad + trailing, 'day').toDate()

      const newEvents = await getVendorCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      )

      setEvents(newEvents.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })))
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load calendar events')
    } finally {
      setIsLoading(false)
    }
  }, [date, view, mode, fleetSpan])

  // Refetch when the visible range changes. Skipped on mount: `page.tsx` already
  // fetched the current month server-side, and refetching it immediately threw
  // that payload away for an identical one.
  const hasFetchedOnce = useRef(false)
  useEffect(() => {
    if (!hasFetchedOnce.current) {
      hasFetchedOnce.current = true
      return
    }
    refetchEvents()
  }, [refetchEvents])

  // RBC hands back the shifted copy, so look the real event up by id before
  // anything formats it. The dialog renders true instants through `toBookingTz`.
  const handleSelectEvent = useCallback((event: CustomEvent) => {
    const real = events.find((e) => e.id === event.id) ?? event
    setSelectedEvent(real)
    setShowEventDialog(true)
  }, [events])

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate)
  }, [])

  // Handle slot selection (for creating unavailability)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    // RBC produced these against the shifted dates, so they are Dubai wall-clock
    // wearing the browser's timezone. Converting back here is what stops a drag
    // from a non-Dubai browser storing a block offset by the timezone delta.
    const start = fromDisplayDate(slotInfo.start)
    const end = fromDisplayDate(slotInfo.end)

    // Courtesy guard only. markResourceUnavailable rejects past dates server-side,
    // which is what actually prevents backdating. Uses the same Dubai boundary as
    // the server so the UI never offers a slot the server will refuse.
    if (start < startOfBookingDayUtc()) {
      toast.info('Cannot mark unavailability for a past date', {
        description: 'Availability can only be blocked from today onwards',
      })
      return
    }

    setSelectedPeriod({ start, end })
    setShowUnavailableDialog(true)
  }, [])

  // Handle creating unavailability
  const handleCreateUnavailability = async (data: UnavailabilitySubmission) => {
    if (!selectedPeriod) return

    try {
      await markResourceUnavailable(
        data.resourceId,
        data.resourceType,
        selectedPeriod.start.toISOString(),
        selectedPeriod.end.toISOString(),
        data.reason,
        data.notes
      )

      await refetchEvents()

      toast.success('Resource marked as unavailable')
      setShowUnavailableDialog(false)
      setSelectedPeriod(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark resource as unavailable')
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove unavailability')
    }
  }

  // The nearest booking outside the visible range, so an empty week is a dead end
  // no longer. Uses the unfiltered set: the point is to find work, and the
  // filters are what hid it.
  const jumpToNextBooking = useCallback(() => {
    const rangeStart = moment(date).startOf(view === 'month' ? 'month' : view === 'week' ? 'week' : 'day')
    const upcoming = events
      .filter((e) => moment(e.start).isAfter(rangeStart))
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0]

    if (upcoming) {
      setDate(upcoming.start)
      return
    }

    // Nothing in the loaded window: step forward a unit and let the refetch look.
    setDate(moment(date).add(1, view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toDate())
  }, [events, date, view])

  const calendarIsEmpty = mode === 'calendar' && !isLoading && displayEvents.length === 0

  return (
    <div className="space-y-4">
      <CalendarFilters
        mode={mode}
        filterType={filterType}
        selectedResourceFilter={selectedResourceFilter}
        sourceFilter={sourceFilter}
        showReleased={showReleased}
        vehicles={vehicles}
        drivers={drivers}
        onModeChange={setMode}
        onFilterTypeChange={handleFilterTypeChange}
        onResourceChange={setSelectedResourceFilter}
        onSourceChange={setSourceFilter}
        onShowReleasedChange={setShowReleased}
      />

      <CalendarLegend />

      <ConflictBanner conflicts={conflicts} onSelectEvent={handleSelectEvent} />

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
          mode === 'calendar' && 'h-[clamp(420px,70vh,760px)] overflow-y-auto'
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
          <>
            <Calendar
              localizer={localizer}
              events={displayEvents}
              startAccessor="start"
              endAccessor="end"
              // Every event carries real times, and none of them is an all-day
              // event. Both props are needed: `allDayAccessor` stops RBC reading
              // a truthy `allDay` field, and `showMultiDayTimes` stops it
              // promoting anything that merely crosses midnight. Without the
              // second one a 22:00-02:00 trip drew as a two-day banner with no
              // hours on it at all.
              allDayAccessor={() => false}
              showMultiDayTimes
              view={view}
              onView={setView}
              date={date}
              onNavigate={handleNavigate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              popup
              scrollToTime={SCROLL_TO_TIME}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
              components={{ toolbar: CalendarToolbar }}
              className="vendor-calendar"
            />

            {calendarIsEmpty && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 top-32 flex items-center justify-center">
                <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-lg border bg-background/95 px-6 py-5 text-center shadow-sm">
                  <CalendarOff className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Nothing scheduled in this {view === 'month' ? 'month' : view}.
                  </p>
                  <Button variant="outline" size="sm" onClick={jumpToNextBooking}>
                    Jump to next booking
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {/* The fleet view is outside react-big-calendar, so it carries its own
                navigation rather than borrowing the RBC toolbar. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={TOOLBAR_BTN} onClick={() => setDate(new Date())}>
                  Today
                </button>
                <button
                  type="button"
                  className={TOOLBAR_BTN}
                  onClick={() => setDate(moment(date).subtract(FLEET_SPANS[fleetSpan].days, 'day').toDate())}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={TOOLBAR_BTN}
                  onClick={() => setDate(moment(date).add(FLEET_SPANS[fleetSpan].days, 'day').toDate())}
                >
                  Next
                </button>
                <MonthYearJump date={date} onJump={setDate} />
              </div>

              <Tabs value={fleetSpan} onValueChange={(v) => setFleetSpan(v as FleetSpan)}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="3day">3 Days</TabsTrigger>
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
              conflictsByResource={conflictsPerResource}
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
        period={selectedPeriod}
      />
    </div>
  )
}

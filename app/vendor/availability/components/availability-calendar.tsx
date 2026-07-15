'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, momentLocalizer, View, SlotInfo, Event as BigCalendarEvent, ToolbarProps } from 'react-big-calendar'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CalendarEvent, markResourceUnavailable, removeUnavailability, getVendorCalendarEvents } from '../actions'
import { startOfBookingDayUtc } from '@/lib/utils/timezone'
import { Car, User, Calendar as CalendarIcon, Clock, MapPin, Phone, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const localizer = momentLocalizer(moment)

interface AvailabilityCalendarProps {
  initialEvents: CalendarEvent[]
  vehicles: any[]
  drivers: any[]
}

interface CustomEvent extends BigCalendarEvent {
  id: string
  resourceId: string
  resourceType: 'vehicle' | 'driver' | 'booking'
  type: 'booking' | 'unavailable'
  vehicleId?: string | null
  driverId?: string | null
  color?: string
  details?: any
}

/** A booking that has already ended, or unavailability that has already elapsed. */
function isPastEvent(event: Pick<CustomEvent, 'end'>): boolean {
  return !!event.end && event.end < new Date()
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
  const [isLoading, setIsLoading] = useState(false)

  // True when the whole visible range has already elapsed.
  const isViewingPast = useMemo(() => {
    const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day'
    return moment(date).endOf(unit).toDate() < startOfBookingDayUtc()
  }, [date, view])

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Filter by resource type. A booking occupies a vehicle *and* a driver, so it
    // belongs to a tab only if it actually has a resource of that kind assigned —
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

    // Filter by specific resource
    if (selectedResourceFilter !== 'all') {
      filtered = filtered.filter(e =>
        e.type === 'booking'
          ? e.vehicleId === selectedResourceFilter || e.driverId === selectedResourceFilter
          : e.resourceId === selectedResourceFilter
      )
    }

    return filtered
  }, [events, filterType, selectedResourceFilter])

  // Fetch events for the range currently on screen. Every refresh path must go
  // through this: calling getVendorCalendarEvents() with no range loads the
  // vendor's entire unbounded history into the current view.
  const refetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day'
      const startDate = moment(date).startOf(unit).toDate()
      const endDate = moment(date).endOf(unit).toDate()

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
  }, [date, view])

  // Refetch events when date or view changes
  useEffect(() => {
    refetchEvents()
  }, [refetchEvents])

  // Custom event style. Past events keep their type colour but recede, so history
  // reads as history and cannot be mistaken for something still actionable.
  const eventStyleGetter = useCallback((event: CustomEvent) => {
    const style: React.CSSProperties = {
      backgroundColor: event.color || '#3B82F6',
      borderRadius: '5px',
      opacity: isPastEvent(event) ? 0.6 : 0.9,
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
    // Courtesy guard only — markResourceUnavailable rejects past dates server-side,
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
          <Label>Resource Type</Label>
          <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)}>
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

        {/* Legend */}
        <div className="flex flex-wrap gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded" />
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded" />
            <span className="text-sm">Cancelled / no trip</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Viewing a period that has already elapsed. Past bookings and unavailability
          are historical and read-only here. Full details live on the Bookings page. */}
      {isViewingPast && (
        <div className="flex items-start gap-2 rounded-lg border border-muted bg-muted/50 p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            You&apos;re viewing past dates. Bookings and unavailability shown here are historical and
            read-only — for full booking records see{' '}
            <Link href="/vendor/bookings" className="font-medium underline underline-offset-4">
              Bookings
            </Link>
            .
          </p>
        </div>
      )}

      {/* Calendar */}
      <div className="h-[600px] bg-background rounded-lg p-4 border relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading events...</span>
            </div>
          </div>
        )}
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
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.type === 'booking' ? 'Booking Details' : 'Unavailability Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.type === 'booking' ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Booking Number:</span>
                      <span className="text-sm">{selectedEvent.details?.bookingNumber}</span>
                    </div>
                    {selectedEvent.details?.status && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant="secondary" className="capitalize">
                          {String(selectedEvent.details.status).replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Customer:</span>
                      <span className="text-sm">{selectedEvent.details?.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Phone:</span>
                      <span className="text-sm">{selectedEvent.details?.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Time:</span>
                      <span className="text-sm">
                        {moment(selectedEvent.start).format('MMM DD, YYYY HH:mm')} -
                        {moment(selectedEvent.end).format('HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm">
                        <div><span className="font-medium">Pickup:</span> {selectedEvent.details?.pickup}</div>
                        <div><span className="font-medium">Dropoff:</span> {selectedEvent.details?.dropoff}</div>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    {selectedEvent.details?.vehicle && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-1">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Vehicle:</span>
                        </div>
                        <div className="text-sm ml-6">
                          <div>{selectedEvent.details.vehicle.make} {selectedEvent.details.vehicle.model}</div>
                          <div className="text-muted-foreground">Reg: {selectedEvent.details.vehicle.registrationNumber}</div>
                        </div>
                      </div>
                    )}

                    {/* Driver Details */}
                    {selectedEvent.details?.driver && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Driver:</span>
                        </div>
                        <div className="text-sm ml-6">
                          <div>{selectedEvent.details.driver.firstName} {selectedEvent.details.driver.lastName}</div>
                          {selectedEvent.details.driver.phone && (
                            <div className="text-muted-foreground">Phone: {selectedEvent.details.driver.phone}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Reason:</span>
                      <Badge variant="destructive">{selectedEvent.details?.reason}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Period:</span>
                      <span className="text-sm">
                        {moment(selectedEvent.start).format('MMM DD, YYYY HH:mm')} -
                        {moment(selectedEvent.end).format('MMM DD, YYYY HH:mm')}
                      </span>
                    </div>
                    {selectedEvent.details?.notes && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="text-sm text-muted-foreground">{selectedEvent.details.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedEvent?.type === 'unavailable' && !isPastEvent(selectedEvent) && (
              <Button variant="destructive" size="sm" onClick={handleRemoveUnavailability}>
                Remove Unavailability
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowEventDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
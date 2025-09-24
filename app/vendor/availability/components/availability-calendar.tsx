'use client'

import { useState, useCallback, useMemo } from 'react'
import { Calendar, momentLocalizer, View, SlotInfo, Event as BigCalendarEvent } from 'react-big-calendar'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CalendarEvent, markResourceUnavailable, removeUnavailability, getVendorCalendarEvents } from '../actions'
import { Car, User, Calendar as CalendarIcon, Clock, MapPin, Phone, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const localizer = momentLocalizer(moment)

interface AvailabilityCalendarProps {
  initialEvents: CalendarEvent[]
  vehicles: any[]
  drivers: any[]
}

interface CustomEvent extends BigCalendarEvent {
  id: string
  resourceId: string
  resourceType: 'vehicle' | 'driver'
  type: 'booking' | 'unavailable'
  color?: string
  details?: any
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

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    let filtered = events

    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.resourceType === filterType)
    }

    if (selectedResourceFilter !== 'all') {
      filtered = filtered.filter(e => e.resourceId === selectedResourceFilter)
    }

    return filtered
  }, [events, filterType, selectedResourceFilter])

  // Custom event style
  const eventStyleGetter = useCallback((event: CustomEvent) => {
    const style: React.CSSProperties = {
      backgroundColor: event.color || '#3B82F6',
      borderRadius: '5px',
      opacity: 0.9,
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

  // Handle slot selection (for creating unavailability)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
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

      // Refresh events
      const newEvents = await getVendorCalendarEvents()
      setEvents(newEvents.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      })))

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

      // Refresh events
      const newEvents = await getVendorCalendarEvents()
      setEvents(newEvents.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      })))

      toast.success('Unavailability removed')
      setShowEventDialog(false)
      setSelectedEvent(null)
    } catch (error) {
      toast.error('Failed to remove unavailability')
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
        <div className="flex gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm">Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-sm">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="h-[600px] bg-background rounded-lg p-4 border">
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
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
            {selectedEvent?.type === 'unavailable' && (
              <Button variant="destructive" onClick={handleRemoveUnavailability}>
                Remove Unavailability
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Mark as Unavailable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
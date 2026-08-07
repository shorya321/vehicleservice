// Imported only by availability-calendar.tsx, which is already a client entry.
import { useState } from 'react'
import { toast } from 'sonner'
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
import { isWholeDayPeriod, unavailabilityPeriodLabel } from '@/lib/availability/period-label'
import type { CalendarDriver, CalendarVehicle } from '../types'

/** Reasons the vendor can pick, by resource kind. Values are stored verbatim in
 *  `resource_unavailability.reason`, which has no DB enum. */
const REASONS = {
  vehicle: [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' },
  ],
  driver: [
    { value: 'leave', label: 'Leave' },
    { value: 'sick', label: 'Sick' },
    { value: 'training', label: 'Training' },
    { value: 'other', label: 'Other' },
  ],
} as const

export interface UnavailabilitySubmission {
  resourceId: string
  resourceType: 'vehicle' | 'driver'
  reason: string
  notes?: string
}

interface UnavailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: CalendarVehicle[]
  drivers: CalendarDriver[]
  onSubmit: (data: UnavailabilitySubmission) => void
  /** The true instants the vendor selected, already un-shifted out of react-big-calendar's display timezone. */
  period: { start: Date; end: Date } | null
}

export function UnavailabilityDialog({
  open,
  onOpenChange,
  vehicles,
  drivers,
  onSubmit,
  period,
}: UnavailabilityDialogProps) {
  const [resourceType, setResourceType] = useState<'vehicle' | 'driver'>('vehicle')
  const [resourceId, setResourceId] = useState('')
  const [reason, setReason] = useState('maintenance')
  const [notes, setNotes] = useState('')

  const handleResourceTypeChange = (next: 'vehicle' | 'driver') => {
    setResourceType(next)
    setResourceId('')
    // The reason lists do not overlap, so a stale value would leave the Select
    // rendering something absent from its own options.
    setReason(next === 'vehicle' ? 'maintenance' : 'leave')
  }

  const handleSubmit = () => {
    if (!resourceId) {
      toast.error('Please select a resource')
      return
    }

    onSubmit({ resourceId, resourceType, reason, notes: notes || undefined })

    setResourceId('')
    setReason(resourceType === 'vehicle' ? 'maintenance' : 'leave')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Resource as Unavailable</DialogTitle>
          <DialogDescription>
            Select a resource and reason for unavailability
            {period && (
              <>
                <span className="mt-2 block text-sm text-foreground">
                  Blocking: {unavailabilityPeriodLabel(period.start, period.end)} (Dubai time)
                </span>
                {isWholeDayPeriod(period.start, period.end) && (
                  // A month cell has no finer granularity than a day, so a drag
                  // there can only ever block whole days. Nothing on screen said
                  // so, and a vendor wanting to block one morning had no way to
                  // discover that the Week and Day views can do it.
                  <span className="mt-1 block text-xs">
                    To block only part of a day, cancel and drag on the Week or Day view instead.
                  </span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Resource Type</Label>
            <Select
              value={resourceType}
              onValueChange={(v) => handleResourceTypeChange(v as 'vehicle' | 'driver')}
            >
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
                  ? vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registration_number})
                      </SelectItem>
                    ))
                  : drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}
                      </SelectItem>
                    ))}
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
                {REASONS[resourceType].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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

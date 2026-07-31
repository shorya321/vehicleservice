'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateAssignmentDuration } from '../actions'
import {
  DEFAULT_TRIP_DURATION_HOURS,
  MAX_TRIP_DURATION_HOURS,
  MIN_TRIP_DURATION_HOURS,
  tripEndFrom,
} from '@/lib/vendor/bookings/duration'
import { toBookingTz } from '@/lib/utils/timezone'

interface ChangeDurationModalProps {
  assignmentId: string
  bookingNumber: string
  /** Pickup instant, ISO. The hold always starts here; only its end moves. */
  pickupDatetime: string
  currentHours: number | null
  onClose: () => void
}

/**
 * Change how long an accepted booking holds its vehicle and driver.
 *
 * A job that overruns would otherwise release both on the original estimate and let another
 * booking take them. Extending moves the release time instead.
 */
export function ChangeDurationModal({
  assignmentId,
  bookingNumber,
  pickupDatetime,
  currentHours,
  onClose,
}: ChangeDurationModalProps) {
  const router = useRouter()
  const initialHours = currentHours ?? DEFAULT_TRIP_DURATION_HOURS
  const [durationHours, setDurationHours] = useState<number>(initialHours)
  const [durationInput, setDurationInput] = useState<string>(String(initialHours))
  const [isSaving, setIsSaving] = useState(false)

  const pickup = new Date(pickupDatetime)
  const releaseLabel = (hours: number) =>
    format(toBookingTz(tripEndFrom(pickup, hours).toISOString()), 'd MMM yyyy, HH:mm')

  const handleDurationChange = (raw: string) => {
    setDurationInput(raw)

    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed)) return
    if (parsed < MIN_TRIP_DURATION_HOURS || parsed > MAX_TRIP_DURATION_HOURS) return

    setDurationHours(parsed)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateAssignmentDuration(assignmentId, durationHours)
      toast.success(`Vehicle and driver now held until ${releaseLabel(durationHours)}`)
      router.refresh()
      onClose()
    } catch (error) {
      // The action names the job that blocks a longer window, so surface it verbatim.
      toast.error(error instanceof Error ? error.message : 'Could not change the duration')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change booking duration</DialogTitle>
          <DialogDescription>
            Booking #{bookingNumber} — currently held until {releaseLabel(initialHours)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="change-duration">Booking duration (hours)</Label>
          <Input
            id="change-duration"
            type="number"
            inputMode="numeric"
            min={MIN_TRIP_DURATION_HOURS}
            max={MAX_TRIP_DURATION_HOURS}
            step={1}
            value={durationInput}
            onChange={(e) => handleDurationChange(e.target.value)}
            onBlur={() => setDurationInput(String(durationHours))}
            disabled={isSaving}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            New release time: {releaseLabel(durationHours)}. Until then the vehicle and driver
            cannot be taken by another booking.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || durationHours === initialHours}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save duration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, User, Car, CheckCircle, XCircle, AlertCircle, Calendar, Plus } from 'lucide-react'
import { getVendorDrivers, getVendorVehicles, acceptAndAssignResources, checkResourceAvailabilityForBooking } from '../actions'
import { QuickAddDriverModal } from './quick-add-driver-modal'
import {
  DEFAULT_TRIP_DURATION_HOURS,
  MAX_TRIP_DURATION_HOURS,
  MIN_TRIP_DURATION_HOURS,
  tripEndFrom,
} from '@/lib/vendor/bookings/duration'
import { toBookingTz } from '@/lib/utils/timezone'
import Link from 'next/link'

interface AssignResourcesModalProps {
  assignmentId: string
  bookingNumber: string
  onClose: () => void
}

interface Driver {
  id: string
  first_name: string
  last_name: string
  phone: string
  license_number: string
  license_type: string | null
  availability?: {
    available: boolean
    conflicts: any[]
  }
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  registration_number: string
  seats: number | null
  transmission: string | null
  fuel_type: string | null
  availability?: {
    available: boolean
    conflicts: any[]
  }
}

export function AssignResourcesModal({
  assignmentId,
  bookingNumber,
  onClose,
}: AssignResourcesModalProps) {
  const router = useRouter()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showQuickAddDriver, setShowQuickAddDriver] = useState(false)
  // How long this booking holds the vehicle and driver. Both are released for other
  // bookings once the window ends, so the vendor sets it to the real length of the job.
  const [durationHours, setDurationHours] = useState<number>(DEFAULT_TRIP_DURATION_HOURS)
  const [durationInput, setDurationInput] = useState<string>(String(DEFAULT_TRIP_DURATION_HOURS))
  const [pickupIso, setPickupIso] = useState<string | null>(null)

  const loadResources = useCallback(async (hours: number) => {
    setIsLoading(true)
    try {
      const availabilityData = await checkResourceAvailabilityForBooking(assignmentId, hours)
      setDrivers(availabilityData.drivers)
      setVehicles(availabilityData.vehicles)
      setPickupIso(availabilityData.bookingTime)

      // A longer window can turn a chosen driver or vehicle busy. Dropping the selection
      // here stops the vendor submitting one the server would reject anyway.
      setSelectedDriverId((current) =>
        current && !availabilityData.drivers.some((d) => d.id === current && d.availability?.available)
          ? ''
          : current
      )
      setSelectedVehicleId((current) =>
        current && !availabilityData.vehicles.some((v) => v.id === current && v.availability?.available)
          ? ''
          : current
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load resources')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId])

  // First open loads immediately; later duration edits are debounced so typing "12" does
  // not fire a check for "1" as well.
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadResources(durationHours)
      return
    }

    const timer = setTimeout(() => loadResources(durationHours), 400)
    return () => clearTimeout(timer)
  }, [loadResources, durationHours])

  const handleDurationChange = (raw: string) => {
    setDurationInput(raw)

    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed)) return
    if (parsed < MIN_TRIP_DURATION_HOURS || parsed > MAX_TRIP_DURATION_HOURS) return

    setDurationHours(parsed)
  }

  // Snap the box back to the value actually in use if the vendor left it empty or invalid.
  const handleDurationBlur = () => setDurationInput(String(durationHours))

  const releaseAtLabel = pickupIso
    ? format(toBookingTz(tripEndFrom(new Date(pickupIso), durationHours).toISOString()), 'd MMM yyyy, HH:mm')
    : null

  const handleDriverCreated = async (driver: { id: string; first_name: string; last_name: string }) => {
    await loadResources(durationHours)
    setSelectedDriverId(driver.id)
  }

  const handleAssign = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error('Please select both driver and vehicle')
      return
    }

    setIsSaving(true)
    try {
      const result = await acceptAndAssignResources(
        assignmentId,
        selectedDriverId,
        selectedVehicleId,
        durationHours
      )

      if (result?.warning) {
        toast.warning(result.warning)
      } else {
        toast.success(`Assigned. Released ${releaseAtLabel ? `on ${releaseAtLabel}` : 'after the booking window'}.`)
      }

      router.refresh()
      onClose()
    } catch (error) {
      // The action names what is blocking (a busy driver or vehicle), so show it rather
      // than a generic failure.
      toast.error(error instanceof Error ? error.message : 'Failed to assign resources')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Driver & Vehicle</DialogTitle>
          <DialogDescription>
            Assign a driver and vehicle for booking #{bookingNumber}
          </DialogDescription>
          <div className="mt-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Link
              href="/vendor/availability"
              target="_blank"
              className="text-sm text-primary hover:underline"
            >
              View full availability calendar →
            </Link>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Booking duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              inputMode="numeric"
              min={MIN_TRIP_DURATION_HOURS}
              max={MAX_TRIP_DURATION_HOURS}
              step={1}
              value={durationInput}
              onChange={(e) => handleDurationChange(e.target.value)}
              onBlur={handleDurationBlur}
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              {releaseAtLabel
                ? `Vehicle and driver stay booked until ${releaseAtLabel}, then free up for other bookings.`
                : `Vehicle and driver stay booked for this long from pickup (${MIN_TRIP_DURATION_HOURS}–${MAX_TRIP_DURATION_HOURS} hours).`}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="driver">Select Driver</Label>
              <button
                type="button"
                onClick={() => setShowQuickAddDriver(true)}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                Add Driver
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center h-10 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select
                value={selectedDriverId}
                onValueChange={setSelectedDriverId}
              >
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Choose a driver..." />
                </SelectTrigger>
                <SelectContent>
                  {drivers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No drivers available
                    </div>
                  ) : (
                    drivers.map((driver) => (
                      <SelectItem
                        key={driver.id}
                        value={driver.id}
                        disabled={!driver.availability?.available}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {driver.first_name} {driver.last_name}
                              </span>
                              {driver.availability?.available ? (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1 text-red-600" />
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              License: {driver.license_number}
                              {driver.license_type && ` (${driver.license_type})`}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Select Vehicle</Label>
            {isLoading ? (
              <div className="flex items-center justify-center h-10 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
              >
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Choose a vehicle..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No vehicles available
                    </div>
                  ) : (
                    vehicles.map((vehicle) => (
                      <SelectItem
                        key={vehicle.id}
                        value={vehicle.id}
                        disabled={!vehicle.availability?.available}
                      >
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {vehicle.make} {vehicle.model} ({vehicle.year})
                              </span>
                              {vehicle.availability?.available ? (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1 text-red-600" />
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {vehicle.registration_number}
                              {vehicle.seats && ` • ${vehicle.seats} seats`}
                              {vehicle.transmission && ` • ${vehicle.transmission}`}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAssign} 
            disabled={isSaving || !selectedDriverId || !selectedVehicleId}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Accept & Assign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <QuickAddDriverModal
        open={showQuickAddDriver}
        onClose={() => setShowQuickAddDriver(false)}
        onDriverCreated={handleDriverCreated}
      />
    </Dialog>
  )
}
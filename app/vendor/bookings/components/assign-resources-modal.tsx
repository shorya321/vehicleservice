'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, User, Car, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react'
import { getVendorDrivers, getVendorVehicles, acceptAndAssignResources, checkResourceAvailabilityForBooking } from '../actions'
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

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    setIsLoading(true)
    try {
      const availabilityData = await checkResourceAvailabilityForBooking(assignmentId)
      setDrivers(availabilityData.drivers)
      setVehicles(availabilityData.vehicles)
    } catch (error) {
      toast.error('Failed to load resources')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedDriverId || !selectedVehicleId) {
      toast.error('Please select both driver and vehicle')
      return
    }

    setIsSaving(true)
    try {
      await acceptAndAssignResources(assignmentId, selectedDriverId, selectedVehicleId)
      toast.success('Resources assigned successfully')
      router.refresh()
      onClose()
    } catch (error) {
      toast.error('Failed to assign resources')
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
            <Label htmlFor="driver">Select Driver</Label>
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
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
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
    </Dialog>
  )
}
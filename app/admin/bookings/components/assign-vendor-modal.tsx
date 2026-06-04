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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { getAvailableVendors, assignBookingToVendor } from '../actions'

interface AssignVendorModalProps {
  bookingId: string
  bookingType: 'customer' | 'business'
  currentVendorId?: string
  vehicleTypeId?: string
  onClose: () => void
}

interface Vendor {
  id: string
  business_name: string
  business_email: string | null
  business_phone: string | null
  business_city: string | null
  hasMatchingVehicle: boolean
}

export function AssignVendorModal({
  bookingId,
  bookingType,
  currentVendorId,
  vehicleTypeId,
  onClose,
}: AssignVendorModalProps) {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string>(currentVendorId || '')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    setIsLoading(true)
    try {
      const vendorList = await getAvailableVendors(vehicleTypeId)
      setVendors(vendorList)
    } catch (error) {
      toast.error('Failed to load vendors')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedVendorId) {
      toast.error('Please select a vendor')
      return
    }

    setIsSaving(true)
    try {
      await assignBookingToVendor(bookingId, bookingType, selectedVendorId, notes)
      toast.success('Booking assigned to vendor successfully')
      router.refresh()
      onClose()
    } catch (error) {
      toast.error('Failed to assign booking to vendor')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentVendorId ? 'Reassign Vendor' : 'Assign Vendor'}
          </DialogTitle>
          <DialogDescription>
            Select a vendor to handle this booking. The vendor will be notified and can assign their driver and vehicle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Select Vendor</Label>
            {isLoading ? (
              <div className="flex items-center justify-center h-10 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select
                value={selectedVendorId}
                onValueChange={setSelectedVendorId}
              >
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Choose a vendor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No vendors available
                    </div>
                  ) : (() => {
                    const matching = vendors.filter(v => v.hasMatchingVehicle)
                    const others = vendors.filter(v => !v.hasMatchingVehicle)
                    return (
                      <>
                        {matching.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600">
                              Recommended — has matching vehicle
                            </div>
                            {matching.map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{vendor.business_name}</span>
                                    {vendor.business_city && (
                                      <span className="text-xs text-muted-foreground">
                                        {vendor.business_city}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                            {others.length > 0 && (
                              <div className="my-1 border-t" />
                            )}
                          </>
                        )}
                        {others.length > 0 && matching.length > 0 && (
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            Other vendors
                          </div>
                        )}
                        {others.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{vendor.business_name}</span>
                              {vendor.business_city && (
                                <span className="text-xs text-muted-foreground">
                                  {vendor.business_city}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )
                  })()}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes for the vendor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isSaving || !selectedVendorId}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Vendor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createDriver } from '@/app/vendor/drivers/actions'

interface QuickAddDriverModalProps {
  open: boolean
  onClose: () => void
  onDriverCreated: (driver: { id: string; first_name: string; last_name: string }) => void
}

export function QuickAddDriverModal({ open, onClose, onDriverCreated }: QuickAddDriverModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')
  const [licenseType, setLicenseType] = useState('regular')

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setLicenseNumber('')
    setLicenseExpiry('')
    setLicenseType('regular')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName || !lastName || !phone || !licenseNumber || !licenseExpiry) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.set('first_name', firstName)
      formData.set('last_name', lastName)
      formData.set('phone', phone)
      formData.set('license_number', licenseNumber)
      formData.set('license_expiry', licenseExpiry)
      formData.set('license_type', licenseType)
      formData.set('is_available', 'true')

      const result = await createDriver(formData)

      if (result.error || !result.data) {
        toast.error(result.error || 'Failed to create driver')
        return
      }

      toast.success('Driver added successfully')
      onDriverCreated({
        id: result.data.id,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
      })
      resetForm()
      onClose()
    } catch {
      toast.error('Failed to add driver')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Driver</DialogTitle>
          <DialogDescription>
            Add a new driver with essential details. You can complete their profile later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qa-first-name">First Name *</Label>
              <Input
                id="qa-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qa-last-name">Last Name *</Label>
              <Input
                id="qa-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-phone">Phone *</Label>
            <Input
              id="qa-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qa-license-number">License Number *</Label>
              <Input
                id="qa-license-number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="DL-12345"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qa-license-type">License Type *</Label>
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger id="qa-license-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="heavy">Heavy Vehicle</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-license-expiry">License Expiry *</Label>
            <Input
              id="qa-license-expiry"
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Driver'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { DriversTable } from './drivers-table'
import { VendorDriver, bulkDeleteDrivers, bulkUpdateDriverStatus, bulkToggleDriverAvailability } from '../actions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DriversTableWithBulkProps {
  drivers: VendorDriver[]
}

export function DriversTableWithBulk({ drivers: initialDrivers }: DriversTableWithBulkProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [newAvailability, setNewAvailability] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(initialDrivers.map(d => d.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectDriver = (driverId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, driverId])
    } else {
      setSelectedIds(selectedIds.filter(id => id !== driverId))
    }
  }

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    const result = await bulkDeleteDrivers(selectedIds)
    setIsProcessing(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${selectedIds.length} driver(s) deleted successfully`)
      setSelectedIds([])
      setShowDeleteDialog(false)
      router.refresh()
    }
  }

  const handleBulkStatusChange = async () => {
    if (!newStatus) {
      toast.error('Please select a status')
      return
    }

    setIsProcessing(true)
    const result = await bulkUpdateDriverStatus(selectedIds, newStatus)
    setIsProcessing(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${selectedIds.length} driver(s) status updated successfully`)
      setSelectedIds([])
      setShowStatusDialog(false)
      setNewStatus('')
      router.refresh()
    }
  }

  const handleBulkAvailabilityToggle = async () => {
    setIsProcessing(true)
    const result = await bulkToggleDriverAvailability(selectedIds, newAvailability)
    setIsProcessing(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${selectedIds.length} driver(s) availability updated successfully`)
      setSelectedIds([])
      setShowAvailabilityDialog(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.length === initialDrivers.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedIds.length} driver(s) selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewAvailability(true)
                setShowAvailabilityDialog(true)
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Available
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewAvailability(false)
                setShowAvailabilityDialog(true)
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Mark Unavailable
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStatusDialog(true)}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Change Status
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Drivers Table with Selection */}
      <div className="space-y-4">
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left">
                  <Checkbox
                    checked={selectedIds.length === initialDrivers.length && initialDrivers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-medium">Name</th>
                <th className="p-4 text-left font-medium">Contact</th>
                <th className="p-4 text-left font-medium">License</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Available</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialDrivers.map((driver) => (
                <tr key={driver.id} className="border-b">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.includes(driver.id)}
                      onCheckedChange={(checked) => handleSelectDriver(driver.id, checked as boolean)}
                    />
                  </td>
                  <td colSpan={6} className="p-0">
                    {/* We embed the original table row content here, but this is simplified */}
                    {/* In practice, you'd extract row rendering logic from DriversTable */}
                    <div className="p-4">
                      {driver.first_name} {driver.last_name}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Use original table for full functionality */}
        <div className={selectedIds.length > 0 ? 'hidden' : ''}>
          <DriversTable drivers={initialDrivers} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} driver(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the selected drivers by marking them as inactive and terminated.
              This action can be reversed by administrators if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status for {selectedIds.length} driver(s)</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 pt-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={isProcessing || !newStatus}
            >
              {isProcessing ? 'Updating...' : 'Update Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Availability Toggle Dialog */}
      <AlertDialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark {selectedIds.length} driver(s) as {newAvailability ? 'Available' : 'Unavailable'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update the availability status for all selected drivers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAvailabilityToggle}
              disabled={isProcessing}
            >
              {isProcessing ? 'Updating...' : 'Update'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

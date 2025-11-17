"use client"

import { useState } from "react"
import { Vehicle } from "@/lib/types/vehicle"
import { VehicleTable } from "./vehicle-table"
import { Button } from "@/components/ui/button"
import { Trash2, Power } from "lucide-react"
import { bulkDeleteVehicles, bulkToggleAvailability } from "../actions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface VehicleTableWithBulkProps {
  vehicles: Vehicle[]
  businessId: string
}

export function VehicleTableWithBulk({ vehicles, businessId }: VehicleTableWithBulkProps) {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles(vehicles.map(v => v.id))
    } else {
      setSelectedVehicles([])
    }
  }

  const handleSelectVehicle = (vehicleId: string, checked: boolean) => {
    if (checked) {
      setSelectedVehicles([...selectedVehicles, vehicleId])
    } else {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId))
    }
  }

  const handleBulkDelete = async () => {
    setIsLoading(true)
    try {
      const result = await bulkDeleteVehicles(selectedVehicles, businessId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedVehicles.length} vehicles deleted successfully`)
        setSelectedVehicles([])
      }
    } catch (error) {
      toast.error("Failed to delete vehicles")
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const handleBulkToggleAvailability = async (isAvailable: boolean) => {
    setIsLoading(true)
    try {
      const result = await bulkToggleAvailability(selectedVehicles, businessId, isAvailable)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedVehicles.length} vehicles marked as ${isAvailable ? 'available' : 'unavailable'}`)
        setSelectedVehicles([])
      }
    } catch (error) {
      toast.error("Failed to update vehicles")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {selectedVehicles.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
          <span className="text-sm font-medium">
            {selectedVehicles.length} vehicle{selectedVehicles.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleAvailability(true)}
              disabled={isLoading}
            >
              <Power className="mr-2 h-4 w-4" />
              Mark Available
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleAvailability(false)}
              disabled={isLoading}
            >
              <Power className="mr-2 h-4 w-4" />
              Mark Unavailable
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <VehicleTable
        vehicles={vehicles}
        businessId={businessId}
        selectedVehicles={selectedVehicles}
        onSelectAll={handleSelectAll}
        onSelectVehicle={handleSelectVehicle}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedVehicles.length} vehicle{selectedVehicles.length === 1 ? '' : 's'} from your fleet.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete Vehicles"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
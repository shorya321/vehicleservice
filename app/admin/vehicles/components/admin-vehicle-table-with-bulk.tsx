"use client"

import { useState } from "react"
import { AdminVehicleTable } from "./admin-vehicle-table"
import { Vehicle } from "@/lib/types/vehicle"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { bulkDeleteAdminVehicles, bulkToggleAdminAvailability } from "../actions"
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react"
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

type VehicleWithDetails = Vehicle & {
  category?: VehicleCategory | null
  vendor?: {
    id: string
    business_name: string
    business_email: string
    user?: {
      full_name: string | null
      email: string
    }
  }
}

interface AdminVehicleTableWithBulkProps {
  vehicles: VehicleWithDetails[]
}

export function AdminVehicleTableWithBulk({ vehicles }: AdminVehicleTableWithBulkProps) {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAvailableDialog, setShowAvailableDialog] = useState(false)
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false)

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
    setIsDeleting(true)
    try {
      const result = await bulkDeleteAdminVehicles(selectedVehicles)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedVehicles.length} vehicles deleted successfully`)
        setSelectedVehicles([])
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleBulkToggleAvailability = async (isAvailable: boolean) => {
    setIsToggling(true)
    try {
      const result = await bulkToggleAdminAvailability(selectedVehicles, isAvailable)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedVehicles.length} vehicles marked as ${isAvailable ? 'available' : 'unavailable'}`)
        setSelectedVehicles([])
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsToggling(false)
      setShowAvailableDialog(false)
      setShowUnavailableDialog(false)
    }
  }

  const selectedCount = selectedVehicles.length
  const hasSelection = selectedCount > 0

  return (
    <div className="space-y-4">
      {hasSelection && (
        <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'vehicle' : 'vehicles'} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAvailableDialog(true)}
            disabled={isToggling}
          >
            <ToggleRight className="mr-2 h-4 w-4" />
            Mark Available
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUnavailableDialog(true)}
            disabled={isToggling}
          >
            <ToggleLeft className="mr-2 h-4 w-4" />
            Mark Unavailable
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <AdminVehicleTable
        vehicles={vehicles}
        selectedVehicles={selectedVehicles}
        onSelectAll={handleSelectAll}
        onSelectVehicle={handleSelectVehicle}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicles</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected {selectedCount === 1 ? 'vehicle' : 'vehicles'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAvailableDialog} onOpenChange={setShowAvailableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Vehicles as Available</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {selectedCount} selected {selectedCount === 1 ? 'vehicle' : 'vehicles'} as available?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkToggleAvailability(true)}
              disabled={isToggling}
            >
              {isToggling ? "Updating..." : "Mark Available"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnavailableDialog} onOpenChange={setShowUnavailableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Vehicles as Unavailable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {selectedCount} selected {selectedCount === 1 ? 'vehicle' : 'vehicles'} as unavailable?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBulkToggleAvailability(false)}
              disabled={isToggling}
            >
              {isToggling ? "Updating..." : "Mark Unavailable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
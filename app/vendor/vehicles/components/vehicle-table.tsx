"use client"

import { useState } from "react"
import { Vehicle } from "@/lib/types/vehicle"
import { VehicleCategory } from "@/lib/types/vehicle-category"

type VehicleWithCategory = Vehicle & {
  category?: VehicleCategory | null
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { 
  Edit, 
  Trash2, 
  Car,
  DollarSign,
  Users,
  Fuel,
  Settings2
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { toggleVehicleAvailability, deleteVehicle } from "../actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface VehicleTableProps {
  vehicles: VehicleWithCategory[]
  businessId: string
  selectedVehicles: string[]
  onSelectAll: (checked: boolean) => void
  onSelectVehicle: (vehicleId: string, checked: boolean) => void
}

export function VehicleTable({ 
  vehicles, 
  businessId,
  selectedVehicles,
  onSelectAll,
  onSelectVehicle
}: VehicleTableProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  async function handleToggleAvailability(vehicleId: string, currentStatus: boolean) {
    setIsUpdating(vehicleId)
    
    try {
      const result = await toggleVehicleAvailability(vehicleId, businessId, !currentStatus)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(currentStatus ? "Vehicle marked as unavailable" : "Vehicle marked as available")
      }
    } catch (error) {
      toast.error("Failed to update vehicle availability")
    } finally {
      setIsUpdating(null)
    }
  }

  async function handleDelete(vehicleId: string) {
    try {
      const result = await deleteVehicle(vehicleId, businessId)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Vehicle deleted successfully")
      }
    } catch (error) {
      toast.error("Failed to delete vehicle")
    }
  }

  const allSelected = vehicles.length > 0 && selectedVehicles.length === vehicles.length
  const someSelected = selectedVehicles.length > 0 && selectedVehicles.length < vehicles.length

  return (
    <div className="rounded-md border">
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all"
                  className="translate-y-[2px]"
                  {...(someSelected && { "data-state": "indeterminate" })}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedVehicles.includes(vehicle.id)}
                    onCheckedChange={(checked) => 
                      onSelectVehicle(vehicle.id, checked as boolean)
                    }
                    aria-label="Select row"
                    className="translate-y-[2px]"
                  />
                </TableCell>
                <TableCell>
                  <div className="relative h-12 w-16 bg-muted rounded overflow-hidden">
                    {vehicle.primary_image_url ? (
                      <Image
                        src={vehicle.primary_image_url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Car className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.year}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {vehicle.category ? (
                    <Badge variant="secondary" className="capitalize">
                      {vehicle.category.name}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <code className="text-sm">{vehicle.registration_number}</code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
                    <span className="font-medium">{vehicle.daily_rate}</span>
                    <span className="text-sm text-muted-foreground ml-1">AED</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Fuel className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize">{vehicle.fuel_type || 'Petrol'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Settings2 className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize">{vehicle.transmission || 'Manual'}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>{vehicle.seats || 5}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={vehicle.is_available || false}
                      onCheckedChange={() => 
                        handleToggleAvailability(vehicle.id, vehicle.is_available || false)
                      }
                      disabled={isUpdating === vehicle.id}
                    />
                    <Badge variant={vehicle.is_available ? "default" : "secondary"}>
                      {vehicle.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/vendor/vehicles/${vehicle.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit vehicle</span>
                      </Link>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete vehicle</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {vehicle.make} {vehicle.model} from your fleet.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(vehicle.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}
"use client"

import { useState } from "react"
import { Vehicle, VehicleType } from "@/lib/types/vehicle"
import { VehicleCategory } from "@/lib/types/vehicle-category"
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
  Settings2,
  Building2
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { toggleAdminVehicleAvailability, deleteAdminVehicle } from "../actions"
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

type VehicleWithDetails = Vehicle & {
  category?: VehicleCategory | null
  vehicle_type?: VehicleType | null
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

interface AdminVehicleTableProps {
  vehicles: VehicleWithDetails[]
  selectedVehicles: string[]
  onSelectAll: (checked: boolean) => void
  onSelectVehicle: (vehicleId: string, checked: boolean) => void
}

export function AdminVehicleTable({ 
  vehicles, 
  selectedVehicles,
  onSelectAll,
  onSelectVehicle,
}: AdminVehicleTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const allSelected = 
    vehicles.length > 0 && 
    vehicles.every(vehicle => selectedVehicles.includes(vehicle.id))
  
  const someSelected = 
    vehicles.some(vehicle => selectedVehicles.includes(vehicle.id)) && 
    !allSelected

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    try {
      const result = await toggleAdminVehicleAvailability(id, !currentStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Vehicle ${!currentStatus ? 'available' : 'unavailable'}`)
      }
    } catch (error) {
      toast.error("Failed to update availability")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteAdminVehicle(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Vehicle deleted successfully")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Car className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by adding the first vehicle.
        </p>
        <Button asChild>
          <Link href="/admin/vehicles/new">
            Add Vehicle
          </Link>
        </Button>
      </div>
    )
  }

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
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Registration</TableHead>
            <TableHead>Vehicle Type</TableHead>
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
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">
                      {vehicle.vendor?.business_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {vehicle.vendor?.user?.email || vehicle.vendor?.business_email}
                    </div>
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
                {vehicle.vehicle_type ? (
                  <div className="space-y-1">
                    <div className="font-medium">{vehicle.vehicle_type.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {vehicle.vehicle_type.passenger_capacity} passengers, {vehicle.vehicle_type.luggage_capacity} bags
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
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
                <div className="flex items-center">
                  <Users className="h-3 w-3 text-muted-foreground mr-1" />
                  <span>{vehicle.seats || 5}</span>
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={vehicle.is_available || false}
                  onCheckedChange={() => handleToggleAvailability(vehicle.id, vehicle.is_available || false)}
                  disabled={togglingId === vehicle.id}
                  aria-label={vehicle.is_available ? "Available" : "Unavailable"}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === vehicle.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this vehicle? This action cannot be undone.
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
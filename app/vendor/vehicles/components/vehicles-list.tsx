"use client"

import { useState } from "react"
import { Vehicle } from "@/lib/types/business"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Car, Calendar, DollarSign, Edit, Fuel, Settings2, Trash2, Users } from "lucide-react"
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

interface VehiclesListProps {
  vehicles: Vehicle[]
  businessId: string
}

export function VehiclesList({ vehicles, businessId }: VehiclesListProps) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id} className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="relative h-48 w-full bg-muted">
              {vehicle.primary_image_url ? (
                <Image
                  src={vehicle.primary_image_url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Car className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute right-2 top-2">
                <Badge variant={vehicle.is_available ? "default" : "secondary"}>
                  {vehicle.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.year} • {vehicle.registration_number}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{vehicle.daily_rate} AED/day</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{vehicle.seats || 5} seats</span>
              </div>
              <div className="flex items-center gap-1">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{vehicle.fuel_type || 'Petrol'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{vehicle.transmission || 'Manual'}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t p-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={vehicle.is_available || false}
                  onCheckedChange={() => handleToggleAvailability(vehicle.id, vehicle.is_available || false)}
                  disabled={isUpdating === vehicle.id}
                />
                <span className="text-sm">Available</span>
              </div>
              
              <div className="flex gap-2">
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
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
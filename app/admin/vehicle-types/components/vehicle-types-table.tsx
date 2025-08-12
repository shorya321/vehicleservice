'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Edit, 
  Trash2, 
  Users, 
  Luggage,
  Tag,
  Hash
} from "lucide-react"
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
import { toast } from "sonner"
import { VehicleTypeWithCategory } from "@/lib/types/vehicle"
import { deleteVehicleType, toggleVehicleTypeStatus } from "../actions"

interface VehicleTypesTableProps {
  vehicleTypes: VehicleTypeWithCategory[]
}

export function VehicleTypesTable({ vehicleTypes }: VehicleTypesTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      await deleteVehicleType(deletingId)
      toast.success("Vehicle type deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete vehicle type")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    setTogglingId(id)
    try {
      await toggleVehicleTypeStatus(id, isActive)
      toast.success(`Vehicle type ${isActive ? 'activated' : 'deactivated'} successfully`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update vehicle type status")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Hash className="h-4 w-4" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Luggage</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicleTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No vehicle types found
                </TableCell>
              </TableRow>
            ) : (
              vehicleTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="text-muted-foreground">
                    {type.sort_order || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p>{type.name}</p>
                      <p className="text-sm text-muted-foreground">{type.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {type.category ? (
                      <Badge variant="secondary" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {type.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">No category</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{type.passenger_capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Luggage className="h-4 w-4 text-muted-foreground" />
                      <span>{type.luggage_capacity || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={type.is_active || false}
                      onCheckedChange={(checked) => handleToggleStatus(type.id, checked)}
                      disabled={togglingId === type.id}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link href={`/admin/vehicle-types/${type.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle type? This action cannot be undone.
              The type cannot be deleted if it&apos;s being used by any vehicles or route pricing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
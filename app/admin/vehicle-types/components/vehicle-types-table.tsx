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
import { Checkbox } from "@/components/ui/checkbox"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Luggage,
  Tag,
  Car,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { BulkActionsBar } from "./bulk-actions-bar"
import { EmptyState } from "@/components/ui/empty-state"

interface VehicleTypesTableProps {
  vehicleTypes: VehicleTypeWithCategory[]
}

export function VehicleTypesTable({ vehicleTypes }: VehicleTypesTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(vehicleTypes.map(t => t.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const isAllSelected = vehicleTypes.length > 0 && selectedIds.size === vehicleTypes.length
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected

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
      <div className="space-y-4">
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            selectedIds={Array.from(selectedIds)}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        )}
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
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
                <TableCell colSpan={7} className="h-[400px] p-0">
                  <EmptyState
                    icon={Car}
                    title="No Vehicle Types Found"
                    description="There are no vehicle types matching your current filters. Try adjusting your search criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              vehicleTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(type.id)}
                      onCheckedChange={(checked) => handleSelect(type.id, checked as boolean)}
                      aria-label="Select vehicle type"
                      className="translate-y-[2px]"
                    />
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vehicle-types/${type.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingId(type.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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
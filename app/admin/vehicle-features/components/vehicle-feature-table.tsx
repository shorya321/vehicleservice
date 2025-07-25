"use client"

import { useState } from "react"
import Link from "next/link"
import { VehicleFeature } from "@/lib/types/vehicle-feature"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Edit, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { deleteVehicleFeature, toggleFeatureStatus } from "../actions"
import { CustomPagination } from "@/components/ui/custom-pagination"

interface VehicleFeatureTableProps {
  features: VehicleFeature[]
  currentPage: number
  totalPages: number
  total: number
}

const categoryColors = {
  safety: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  comfort: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  technology: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  entertainment: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  convenience: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  performance: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function VehicleFeatureTable({ features, currentPage, totalPages, total }: VehicleFeatureTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [featureToDelete, setFeatureToDelete] = useState<VehicleFeature | null>(null)

  const handleDelete = async () => {
    if (!featureToDelete) return

    setDeletingId(featureToDelete.id)
    const result = await deleteVehicleFeature(featureToDelete.id)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Feature deleted successfully")
    }
    
    setDeletingId(null)
    setDeleteDialogOpen(false)
    setFeatureToDelete(null)
  }

  const handleToggleStatus = async (feature: VehicleFeature) => {
    setTogglingId(feature.id)
    const result = await toggleFeatureStatus(feature.id, !feature.is_active)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Feature ${!feature.is_active ? 'activated' : 'deactivated'} successfully`)
    }
    
    setTogglingId(null)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No features found
                </TableCell>
              </TableRow>
            ) : (
              features.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{feature.name}</div>
                      {feature.description && (
                        <div className="text-sm text-muted-foreground">{feature.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {feature.category && (
                      <Badge className={categoryColors[feature.category as keyof typeof categoryColors] || "bg-gray-100"}>
                        {feature.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {feature.icon && (
                      <span className="text-sm text-muted-foreground">{feature.icon}</span>
                    )}
                  </TableCell>
                  <TableCell>{feature.sort_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={feature.is_active || false}
                      onCheckedChange={() => handleToggleStatus(feature)}
                      disabled={togglingId === feature.id}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={deletingId === feature.id}
                        >
                          <span className="sr-only">Open menu</span>
                          {deletingId === feature.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vehicle-features/${feature.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setFeatureToDelete(feature)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
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

      {totalPages > 1 && (
        <div className="mt-4">
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/admin/vehicle-features"
          />
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{featureToDelete?.name}&quot;? This action cannot be undone.
              {featureToDelete && (
                <div className="mt-2 text-sm text-yellow-600">
                  Note: You can only delete features that are not assigned to any vehicles.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
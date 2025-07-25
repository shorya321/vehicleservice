'use client'

import { useState } from "react"
import { RouteWithDetails, PaginatedRoutes } from "@/lib/types/route"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  Car,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Star,
  StarOff,
  MoreHorizontal,
  DollarSign
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { deleteRoute, toggleRouteStatus, toggleRoutePopular } from "../actions"
import { toast } from "sonner"
import { CustomPagination } from "@/components/ui/custom-pagination"
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
import { RouteBulkActionsBar } from "./route-bulk-actions-bar"

interface RoutesTableWithBulkProps {
  routes: RouteWithDetails[]
  pagination: PaginatedRoutes
}

export function RoutesTableWithBulk({ routes, pagination }: RoutesTableWithBulkProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleDelete = async (id: string) => {
    try {
      setLoadingId(id)
      await deleteRoute(id)
      toast.success("Route deleted successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete route")
    } finally {
      setLoadingId(null)
      setDeleteId(null)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setLoadingId(id)
      await toggleRouteStatus(id, !currentStatus)
      toast.success(`Route ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update route status")
    } finally {
      setLoadingId(null)
    }
  }

  const handleTogglePopular = async (id: string, currentStatus: boolean) => {
    try {
      setLoadingId(id)
      await toggleRoutePopular(id, !currentStatus)
      toast.success(`Route ${!currentStatus ? 'marked as popular' : 'unmarked as popular'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update route")
    } finally {
      setLoadingId(null)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(routes.map(route => route.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRoute = (routeId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, routeId])
    } else {
      setSelectedIds(prev => prev.filter(id => id !== routeId))
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const isAllSelected = routes.length > 0 && selectedIds.length === routes.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < routes.length

  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No routes</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new route.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/admin/routes/new">
              Add Route
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <RouteBulkActionsBar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(ref) => {
                    if (ref) ref.indeterminate = isIndeterminate
                  }}
                />
              </TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Distance/Duration</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Popularity</TableHead>
              <TableHead>Vendors</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(route.id)}
                    onCheckedChange={(checked) => handleSelectRoute(route.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{route.route_name}</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {route.origin_location.name} → {route.destination_location.name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <div>{route.distance_km} km</div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {route.estimated_duration_minutes} min
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(route.base_price)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePopular(route.id, route.is_popular)}
                        disabled={loadingId === route.id}
                      >
                        {route.is_popular ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      {route.is_popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    {route.search_count && route.search_count > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {route.search_count} searches
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {route.vendor_count || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(route.id, route.is_active)}
                    disabled={loadingId === route.id}
                  >
                    {route.is_active ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/routes/${route.id}/pricing`}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Manage Pricing
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/routes/${route.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Route
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(route.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <CustomPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            baseUrl="/admin/routes"
          />
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the route
              and remove it from all vendor services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
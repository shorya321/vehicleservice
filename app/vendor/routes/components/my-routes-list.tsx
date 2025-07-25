'use client'

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Edit, Trash2, MapPin, Clock, DollarSign, Share2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RouteWithLocations } from "@/lib/types/route"
import { updateVendorRoute, deleteVendorRoute } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { VendorRouteBulkActionsBar } from "./vendor-route-bulk-actions-bar"

interface MyRoutesListProps {
  routes: RouteWithLocations[]
}

export function MyRoutesList({ routes }: MyRoutesListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [deleteRoute, setDeleteRoute] = useState<RouteWithLocations | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const router = useRouter()

  const handleToggleActive = async (routeId: string, isActive: boolean) => {
    setIsLoading(routeId)
    try {
      await updateVendorRoute(routeId, { is_active: isActive })
      toast.success(isActive ? 'Route activated' : 'Route deactivated')
      router.refresh()
    } catch (error) {
      console.error('Error updating route:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update route')
    } finally {
      setIsLoading(null)
    }
  }

  const handleToggleShared = async (routeId: string, isShared: boolean) => {
    setIsLoading(routeId)
    try {
      await updateVendorRoute(routeId, { is_shared: isShared })
      toast.success(isShared ? 'Route is now shared' : 'Route is now private')
      router.refresh()
    } catch (error) {
      console.error('Error updating route:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update route')
    } finally {
      setIsLoading(null)
    }
  }

  const handleDelete = async (routeId: string) => {
    setIsLoading(routeId)
    try {
      await deleteVendorRoute(routeId)
      toast.success('Route deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Error deleting route:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete route')
    } finally {
      setIsLoading(null)
      setDeleteRoute(null)
    }
  }

  const handleSelectAllChange = (value: boolean | 'indeterminate') => {
    if (value === 'indeterminate') return
    handleSelectAll(value)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }
    return `${remainingMinutes}m`
  }

  if (routes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg mb-2">No routes yet</CardTitle>
          <CardDescription className="text-center mb-4">
            You haven&apos;t created any routes yet. Create your first route to start offering transfer services.
          </CardDescription>
        </CardContent>
      </Card>
    )
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

  const isAllSelected = routes.length > 0 && selectedIds.length === routes.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < routes.length

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <VendorRouteBulkActionsBar
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
                  onCheckedChange={handleSelectAllChange}
                  ref={(ref) => {
                    if (ref) ref.indeterminate = isIndeterminate
                  }}
                />
              </TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Shared</TableHead>
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
                      {route.origin_location.name} → {route.destination_location.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {route.origin_location.city} → {route.destination_location.city}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{route.distance_km} km</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDuration(route.estimated_duration_minutes)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${route.base_price}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={route.is_active}
                      onCheckedChange={(checked) => handleToggleActive(route.id, checked)}
                      disabled={isLoading === route.id}
                    />
                    <Badge variant={route.is_active ? "default" : "secondary"}>
                      {route.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={route.is_shared}
                      onCheckedChange={(checked) => handleToggleShared(route.id, checked)}
                      disabled={isLoading === route.id}
                    />
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={route.is_shared ? "default" : "outline"}>
                        {route.is_shared ? "Shared" : "Private"}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/vendor/routes/${route.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteRoute(route)}
                        className="text-red-600"
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

      <AlertDialog open={!!deleteRoute} onOpenChange={() => setDeleteRoute(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the route
              &quot;{deleteRoute?.route_name}&quot; and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRoute && handleDelete(deleteRoute.id)}
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
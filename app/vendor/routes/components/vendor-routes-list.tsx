'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Settings, 
  TrendingUp,
  Star
} from "lucide-react"
import { RouteWithLocations, VendorRouteService } from "@/lib/types/route"
import { toggleVendorRoute, updateVendorRouteSettings } from "../actions"
import { toast } from "sonner"

interface RouteWithVendorInfo extends RouteWithLocations {
  vendorService: VendorRouteService | null
}

interface VendorRoutesListProps {
  routes: RouteWithVendorInfo[]
}

export function VendorRoutesList({ routes }: VendorRoutesListProps) {
  const [loadingRoutes, setLoadingRoutes] = useState<Set<string>>(new Set())
  const [settingsRoute, setSettingsRoute] = useState<RouteWithVendorInfo | null>(null)
  const [priceMultiplier, setPriceMultiplier] = useState(1.0)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleToggleRoute = async (routeId: string, isActive: boolean) => {
    setLoadingRoutes(prev => new Set(prev).add(routeId))
    try {
      await toggleVendorRoute(routeId, isActive)
      toast.success(isActive ? 'Route enabled successfully' : 'Route disabled successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update route')
    } finally {
      setLoadingRoutes(prev => {
        const newSet = new Set(prev)
        newSet.delete(routeId)
        return newSet
      })
    }
  }

  const handleOpenSettings = (route: RouteWithVendorInfo) => {
    setSettingsRoute(route)
    setPriceMultiplier(route.vendorService?.price_multiplier || 1.0)
    setDialogOpen(true)
  }

  const handleCloseSettings = () => {
    setDialogOpen(false)
    setSettingsRoute(null)
  }

  const handleSaveSettings = async () => {
    if (!settingsRoute) return

    try {
      await updateVendorRouteSettings(settingsRoute.id, {
        price_multiplier: priceMultiplier,
        is_active: settingsRoute.vendorService?.is_active || false
      })
      toast.success('Route settings updated successfully')
      handleCloseSettings()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const calculateVendorPrice = (basePrice: number, multiplier: number) => {
    return basePrice * multiplier
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No routes available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Contact admin to add routes to the system.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route</TableHead>
              <TableHead>Distance/Duration</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Your Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => {
              const isActive = route.vendorService?.is_active || false
              const priceMultiplier = route.vendorService?.price_multiplier || 1.0
              const vendorPrice = calculateVendorPrice(route.base_price, priceMultiplier)
              const isLoading = loadingRoutes.has(route.id)

              return (
                <TableRow key={route.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        {route.route_name}
                        {route.is_popular && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {formatPrice(route.base_price)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      {formatPrice(vendorPrice)}
                      {priceMultiplier !== 1.0 && (
                        <Badge 
                          variant={priceMultiplier > 1.0 ? "default" : "secondary"}
                          className="text-xs ml-1"
                        >
                          {priceMultiplier > 1.0 ? '+' : ''}{Math.round((priceMultiplier - 1) * 100)}%
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => handleToggleRoute(route.id, checked)}
                        disabled={isLoading}
                      />
                      <span className="text-sm text-muted-foreground">
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSettings(route)}
                      disabled={isLoading}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Route Settings</DialogTitle>
            <DialogDescription>
              Configure pricing and settings for {settingsRoute?.route_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price-multiplier">Price Multiplier</Label>
              <Input
                id="price-multiplier"
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={priceMultiplier}
                onChange={(e) => setPriceMultiplier(parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Base price: {formatPrice(settingsRoute?.base_price || 0)} × {priceMultiplier} = {formatPrice(calculateVendorPrice(settingsRoute?.base_price || 0, priceMultiplier))}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCloseSettings}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>Save Settings</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
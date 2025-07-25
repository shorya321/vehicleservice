'use client'

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Route, MapPin } from "lucide-react"
import { RouteWithLocations, VendorRouteService, RouteFilters } from "@/lib/types/route"
import { VendorRoutesList } from "./vendor-routes-list"
import { CreateRouteDialog } from "./create-route-dialog"
import { MyRoutesList } from "./my-routes-list"
import { VendorClientFilters } from "./vendor-client-filters"

interface RouteWithVendorInfo extends RouteWithLocations {
  vendorService: VendorRouteService | null
}

interface VendorRoutesWithTabsProps {
  vendorRoutes: RouteWithLocations[]
  availableRoutes: RouteWithVendorInfo[]
  locations: Array<{
    id: string
    name: string
    city: string
    country_code: string
    type: string
  }>
  filters: RouteFilters
  activeTab: 'my-routes' | 'available-routes'
}

export function VendorRoutesWithTabs({ vendorRoutes, availableRoutes, locations, filters, activeTab: initialTab }: VendorRoutesWithTabsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/vendor/routes?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <VendorClientFilters initialFilters={filters} activeTab={initialTab} />
      
      <Tabs value={initialTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            My Routes ({vendorRoutes.length})
          </TabsTrigger>
          <TabsTrigger value="available-routes" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Available Routes ({availableRoutes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-routes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Routes</CardTitle>
                  <CardDescription>
                    Routes you have created for your service area
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Route
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MyRoutesList routes={vendorRoutes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available-routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Routes</CardTitle>
              <CardDescription>
                Routes created by admins and other vendors that you can join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorRoutesList routes={availableRoutes} />
            </CardContent>
          </Card>
        </TabsContent>

        <CreateRouteDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
          locations={locations}
        />
      </Tabs>
    </div>
  )
}
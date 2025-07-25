import { notFound } from "next/navigation"
import { Metadata } from "next"
import { VendorLayout } from "@/components/layout/vendor-layout"
import { requireVendor } from "@/lib/auth/user-actions"
import { EditRouteForm } from "./components/edit-route-form"
import { getVendorRouteById, getLocationsForRouteCreation } from "../../actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: 'Edit Route - Vendor Portal',
  description: 'Edit your route details',
}

interface VendorRouteEditPageProps {
  params: {
    id: string
  }
}

export default async function VendorRouteEditPage({ params }: VendorRouteEditPageProps) {
  await requireVendor()
  
  const [route, locations] = await Promise.all([
    getVendorRouteById(params.id),
    getLocationsForRouteCreation()
  ])

  if (!route) {
    notFound()
  }

  return (
    <VendorLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Link href="/vendor/routes">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Routes
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold">Edit Route</h1>
          <p className="text-muted-foreground mt-1">
            Update your route details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
            <CardDescription>
              Modify the information for your route
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditRouteForm route={route} locations={locations} />
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}
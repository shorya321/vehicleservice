import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { VehicleTypeForm } from "../../components/vehicle-type-form"
import { getVehicleType } from "../../actions"
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: "Edit Vehicle Type | Admin",
  description: "Update vehicle type details",
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditVehicleTypePage({ params }: PageProps) {
  const { id } = await params
  const vehicleType = await getVehicleType(id)

  if (!vehicleType) {
    notFound()
  }

  const supabase = await createClient()
  
  // Get categories for the form
  const { data: categories } = await supabase
    .from('vehicle_categories')
    .select('id, name')
    .order('sort_order, name')

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/vehicle-types">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Vehicle Type</h1>
            <p className="text-muted-foreground">
              Update {vehicleType.name} details
            </p>
          </div>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Vehicle Type Details</CardTitle>
            <CardDescription>
              Update the vehicle type characteristics and capacities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleTypeForm 
              vehicleType={vehicleType} 
              categories={categories || []} 
            />
          </CardContent>
        </Card>
      </div>
  )
}
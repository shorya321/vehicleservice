import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { VehicleTypeForm } from "../components/vehicle-type-form"
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: "Add Vehicle Type | Admin",
  description: "Create a new vehicle type",
}

export default async function NewVehicleTypePage() {
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
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add Vehicle Type</h1>
            <p className="text-muted-foreground">
              Create a new vehicle type for your fleet
            </p>
          </div>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Vehicle Type Details</CardTitle>
            <CardDescription>
              Define the vehicle type characteristics and capacities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleTypeForm categories={categories || []} />
          </CardContent>
        </Card>
      </div>
  )
}
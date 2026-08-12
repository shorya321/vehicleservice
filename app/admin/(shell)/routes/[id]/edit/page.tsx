import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth/actions"
import { RouteForm } from "../../components/route-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getRoute } from "../../actions"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import { LocationWithType } from "@/lib/types/location"

export const metadata: Metadata = {
  title: 'Edit Route - Admin Portal',
  description: 'Edit transfer route',
}

interface EditRoutePageProps {
  params: Promise<{ id: string }>
}

export default async function EditRoutePage({ params }: EditRoutePageProps) {
  await requireAdmin()
  
  const { id } = await params
  const route = await getRoute(id)
  
  if (!route) {
    notFound()
  }

  // Fetch locations for the form
  const supabase = await createClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('*, location_types(*)')
    .eq('is_active', true)
    .order('name')

  // Ensure route's origin and destination are always in the list
  // (Supabase default limit is 1000 rows, or locations may be inactive)
  const locationList = (locations || []) as unknown as LocationWithType[]
  const locationIds = new Set(locationList.map(l => l.id))
  const missingIds = [route.origin_location_id, route.destination_location_id]
    .filter((id): id is string => !!id && !locationIds.has(id))

  if (missingIds.length > 0) {
    const { data: missingLocations } = await supabase
      .from('locations')
      .select('*, location_types(*)')
      .in('id', missingIds)
    if (missingLocations) {
      locationList.unshift(...(missingLocations as unknown as LocationWithType[]))
    }
  }

  return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/routes">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle>Edit Route</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <RouteForm route={route} locations={locationList} />
          </CardContent>
        </Card>
      </div>
  )
}
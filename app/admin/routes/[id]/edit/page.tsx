import { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/actions"
import { RouteForm } from "../../components/route-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRoute } from "../../actions"
import { createClient } from "@/lib/supabase/server"

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
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Route</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteForm route={route} locations={locations || []} />
          </CardContent>
        </Card>
      </div>
  )
}
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
            <RouteForm route={route} locations={locations || []} />
          </CardContent>
        </Card>
      </div>
  )
}
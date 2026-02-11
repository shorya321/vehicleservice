import { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/actions"
import { RouteForm } from "../components/route-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: 'Add Route - Admin Portal',
  description: 'Create a new transfer route',
}

export default async function NewRoutePage() {
  await requireAdmin()
  
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
            <CardTitle>Add New Route</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteForm locations={locations || []} />
          </CardContent>
        </Card>
      </div>
  )
}
import { Metadata } from "next"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth/actions"
import { RouteForm } from "../components/route-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"

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
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/routes">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle>Add New Route</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <RouteForm locations={locations || []} />
          </CardContent>
        </Card>
      </div>
  )
}
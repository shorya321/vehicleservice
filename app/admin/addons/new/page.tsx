import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AddonForm } from "../components/addon-form"

export const metadata: Metadata = {
  title: "New Addon | Admin",
  description: "Create a new booking addon",
}

export default function NewAddonPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/addons">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Addon</h1>
            <p className="text-muted-foreground">
              Create a new addon for bookings
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Addon Details</CardTitle>
            <CardDescription>
              Configure the addon name, pricing, and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddonForm />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

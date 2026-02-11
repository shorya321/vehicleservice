import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AddonForm } from "../../components/addon-form"
import { getAddon } from "../../actions"

export const metadata: Metadata = {
  title: "Edit Addon | Admin",
  description: "Edit booking addon",
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditAddonPage({ params }: PageProps) {
  const { id } = await params
  const addon = await getAddon(id)

  if (!addon) {
    notFound()
  }

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/addons">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Addon</h1>
            <p className="text-muted-foreground">
              Update {addon.name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Addon Details</CardTitle>
            <CardDescription>
              Update the addon configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddonForm addon={addon} />
          </CardContent>
        </Card>
      </div>
  )
}

import { notFound } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { getUser } from "../../actions"
import { PhotoUploadForm } from "./photo-upload-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PhotoUploadPageProps {
  params: {
    id: string
  }
}

export default async function PhotoUploadPage({ params }: PhotoUploadPageProps) {
  const user = await getUser(params.id)
  
  if (!user) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Upload Profile Photo
              </h1>
              <p className="text-muted-foreground">
                {user.full_name || user.email}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>
              Upload a new profile photo for this user. Recommended size: 200x200px
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUploadForm user={user} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
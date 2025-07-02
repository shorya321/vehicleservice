import { notFound } from "next/navigation"
import { AdminLayout } from "@/components/layout/admin-layout"
import { UserForm } from "../components/user-form"
import { getUser } from "../actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await getUser(params.id)

  if (!user) {
    notFound()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
            <p className="text-muted-foreground">
              Update user information and permissions
            </p>
          </div>
        </div>

        <UserForm mode="edit" user={user} />
      </div>
    </AdminLayout>
  )
}
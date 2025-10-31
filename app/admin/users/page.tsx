import { Suspense } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Button } from "@/components/ui/button"
import { UserTableWithBulk } from "./components/user-table-with-bulk"
import { ClientFilters } from "./components/client-filters"
import { getUsers } from "./actions"
import { createClient } from "@/lib/supabase/server"
import { UserFilters } from "@/lib/types/user"
import Link from "next/link"
import { Plus, Users } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { AnimatedPage } from "@/components/layout/animated-page"
import { AnimatedCard } from "@/components/ui/animated-card"

export const dynamic = 'force-dynamic'

interface UsersPageProps {
  searchParams: Promise<{
    search?: string
    role?: string
    status?: string
    page?: string
    emailVerified?: string
    twoFactorEnabled?: string
    hasSignedIn?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  const params = await searchParams

  const filters: UserFilters = {
    search: params.search,
    role: (params.role as any) || 'all',
    status: (params.status as any) || 'all',
    page: params.page ? parseInt(params.page) : 1,
    limit: 10,
    ...(params.emailVerified && { 
      emailVerified: params.emailVerified === 'true'
    }),
    ...(params.twoFactorEnabled && { 
      twoFactorEnabled: params.twoFactorEnabled === 'true'
    }),
    ...(params.hasSignedIn && { 
      hasSignedIn: params.hasSignedIn === 'true'
    })
  } as any

  const { users, total, page, totalPages } = await getUsers(filters)

  return (
    <AdminLayout>
      <AnimatedPage>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Users', href: '/admin/users' }
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <AnimatedCard delay={0.1}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-luxury-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>

        <AnimatedCard delay={0.2}>
          <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage all registered users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientFilters initialFilters={filters} />
            
            <UserTableWithBulk 
              users={users} 
              currentUserId={currentUser?.id}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * filters.limit!) + 1} to{" "}
                  {Math.min(page * filters.limit!, total)} of {total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    asChild
                  >
                    <Link
                      href={{
                        pathname: "/admin/users",
                        query: {
                          ...params,
                          page: page - 1,
                        },
                      }}
                    >
                      Previous
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    asChild
                  >
                    <Link
                      href={{
                        pathname: "/admin/users",
                        query: {
                          ...params,
                          page: page + 1,
                        },
                      }}
                    >
                      Next
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </AnimatedCard>
      </AnimatedPage>
    </AdminLayout>
  )
}
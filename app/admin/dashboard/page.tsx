import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminLayout } from "@/components/layout/admin-layout"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Activity,
  Download,
  Filter,
  Mail,
  Shield,
  MapPin,
} from "lucide-react"

const recentActivities = [
  {
    id: "1",
    user: "Ahmed Ali",
    avatar: "/avatars/01.png",
    action: "User registered",
    date: "2024-06-20",
    type: "registration",
  },
  {
    id: "2",
    user: "Sarah Johnson",
    avatar: "/avatars/02.png",
    action: "Profile updated",
    date: "2024-06-21",
    type: "update",
  },
  {
    id: "3",
    user: "Mohammed Khan",
    avatar: "/avatars/03.png",
    action: "Email verified",
    date: "2024-06-21",
    type: "verification",
  },
  {
    id: "4",
    user: "Emily Chen",
    avatar: "/avatars/04.png",
    action: "2FA enabled",
    date: "2024-06-22",
    type: "security",
  },
  {
    id: "5",
    user: "John Smith",
    avatar: "/avatars/05.png",
    action: "Password changed",
    date: "2024-06-22",
    type: "security",
  },
]

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Check if user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/admin/login')
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Get real statistics
  const { data: userStats } = await supabase
    .from('profiles')
    .select('email_verified, two_factor_enabled, status')
  
  const { data: locationStats } = await supabase
    .from('locations')
    .select('is_active')
  
  const totalUsers = userStats?.length || 0
  const verifiedUsers = userStats?.filter(u => u.email_verified).length || 0
  const twoFactorUsers = userStats?.filter(u => u.two_factor_enabled).length || 0
  const activeUsers = userStats?.filter(u => u.status === 'active').length || 0
  const totalLocations = locationStats?.length || 0
  const activeLocations = locationStats?.filter(l => l.is_active).length || 0
  
  const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0
  const twoFactorRate = totalUsers > 0 ? Math.round((twoFactorUsers / totalUsers) * 100) : 0

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your business.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={totalUsers.toString()}
            description="Registered users"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Verified Users"
            value={`${verificationRate}%`}
            description={`${verifiedUsers} of ${totalUsers} verified`}
            icon={Mail}
            trend={{ value: verificationRate > 70 ? 5 : -5, isPositive: verificationRate > 70 }}
          />
          <StatCard
            title="2FA Enabled"
            value={`${twoFactorRate}%`}
            description={`${twoFactorUsers} users with 2FA`}
            icon={Shield}
            trend={{ value: twoFactorRate > 30 ? 8 : -3, isPositive: twoFactorRate > 30 }}
          />
          <StatCard
            title="Active Locations"
            value={activeLocations.toString()}
            description={`${totalLocations} total locations`}
            icon={MapPin}
            trend={{ value: 8, isPositive: true }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest user activities and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.avatar} />
                            <AvatarFallback>
                              {activity.user.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{activity.user}</span>
                        </div>
                      </TableCell>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{activity.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            activity.type === "security"
                              ? "default"
                              : activity.type === "verification"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {activity.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                Overview of user account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Active Users</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {activeUsers} of {totalUsers}
                      </span>
                      <Badge variant="default" className="text-xs">
                        {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Email Verified</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {verifiedUsers} users
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {verificationRate}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{
                        width: `${verificationRate}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">2FA Enabled</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {twoFactorUsers} users
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {twoFactorRate}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${twoFactorRate}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Sessions
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">573</div>
                  <p className="text-xs text-muted-foreground">
                    +201 since last hour
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    System Health
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.9%</div>
                  <p className="text-xs text-muted-foreground">
                    Uptime last 30 days
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Security Score
                  </CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">A+</div>
                  <p className="text-xs text-muted-foreground">
                    All security checks passed
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
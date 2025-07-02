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
  Car, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Activity,
  CreditCard,
  Package,
  MoreHorizontal,
  Download,
  Filter,
  Mail,
  Shield,
} from "lucide-react"

const recentBookings = [
  {
    id: "1",
    customer: "Ahmed Ali",
    avatar: "/avatars/01.png",
    service: "Desert Safari",
    date: "2024-06-20",
    status: "confirmed",
    amount: "$250",
  },
  {
    id: "2",
    customer: "Sarah Johnson",
    avatar: "/avatars/02.png",
    service: "Airport Transfer",
    date: "2024-06-21",
    status: "pending",
    amount: "$85",
  },
  {
    id: "3",
    customer: "Mohammed Khan",
    avatar: "/avatars/03.png",
    service: "City Tour",
    date: "2024-06-21",
    status: "completed",
    amount: "$120",
  },
  {
    id: "4",
    customer: "Emily Chen",
    avatar: "/avatars/04.png",
    service: "Desert Safari",
    date: "2024-06-22",
    status: "confirmed",
    amount: "$450",
  },
  {
    id: "5",
    customer: "John Smith",
    avatar: "/avatars/05.png",
    service: "Private Transfer",
    date: "2024-06-22",
    status: "cancelled",
    amount: "$95",
  },
]

const topServices = [
  { name: "Desert Safari Premium", bookings: 145, revenue: "$36,250", growth: 12 },
  { name: "Airport Transfer", bookings: 98, revenue: "$8,330", growth: 8 },
  { name: "City Tour", bookings: 76, revenue: "$9,120", growth: -3 },
  { name: "Private Transfer", bookings: 65, revenue: "$6,175", growth: 15 },
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
    .select('email_verified, two_factor_enabled')
  
  const totalUsers = userStats?.length || 0
  const verifiedUsers = userStats?.filter(u => u.email_verified).length || 0
  const twoFactorUsers = userStats?.filter(u => u.two_factor_enabled).length || 0
  
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
            title="Available Vehicles"
            value="48"
            description="Ready for service"
            icon={Car}
            trend={{ value: 5, isPositive: false }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>
                Latest customer bookings and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.avatar} />
                            <AvatarFallback>
                              {booking.customer.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{booking.customer}</span>
                        </div>
                      </TableCell>
                      <TableCell>{booking.service}</TableCell>
                      <TableCell>{booking.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === "completed"
                              ? "default"
                              : booking.status === "confirmed"
                              ? "secondary"
                              : booking.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {booking.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
              <CardDescription>
                Best performing services this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topServices.map((service, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{service.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {service.bookings} bookings
                        </span>
                        <Badge
                          variant={service.growth > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {service.growth > 0 ? "+" : ""}{service.growth}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(service.bookings / 145) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium min-w-[80px] text-right">
                        {service.revenue}
                      </span>
                    </div>
                  </div>
                ))}
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
                    Payment Success Rate
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Inventory Status
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">86%</div>
                  <p className="text-xs text-muted-foreground">
                    Vehicles available
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
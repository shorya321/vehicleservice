import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookingsTable } from "@/components/bookings/bookings-table"
import { requireCustomer } from "@/lib/auth/user-actions"
import {
  Shield,
  Settings,
  User,
  Activity,
  ArrowRight,
  Bell,
  Building2,
  Car,
  Calendar,
} from "lucide-react"
import Link from "next/link"

export default async function CustomerDashboard() {
  const user = await requireCustomer()
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  // Check if user has a vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('status')
    .eq('user_id', user.id)
    .single()
  
  // Fetch user's recent bookings
  const { data: bookings } = await adminClient
    .from('bookings')
    .select(`
      *,
      vehicle_type:vehicle_types(name),
      booking_assignments (
        status,
        vendor:vendor_applications (
          business_name
        ),
        driver:vendor_drivers (
          first_name,
          last_name
        )
      )
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)
  
  // Count total bookings
  const { count: totalBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
  
  // Count upcoming bookings
  const { count: upcomingBookings } = await adminClient
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id)
    .eq('booking_status', 'confirmed')
    .gte('pickup_datetime', new Date().toISOString())
  
  return (
    <CustomerLayout user={user}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.profile?.full_name || 'Customer'}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your account and activities
          </p>
        </div>

        {/* Vendor Application Section */}
        {!vendorApplication && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Become a Vendor
              </CardTitle>
              <CardDescription>
                Start your vehicle rental business with us
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Join our platform as a vendor and list your vehicles for rent. 
                Manage your fleet, set your prices, and grow your business.
              </p>
              <Button asChild>
                <Link href="/customer/apply-vendor">
                  Apply Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {vendorApplication && (
          <Card className={
            vendorApplication.status === 'pending' 
              ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950"
              : vendorApplication.status === 'approved'
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
          }>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Application Status
              </CardTitle>
              <CardDescription>
                {vendorApplication.status === 'pending' && "Your application is being reviewed"}
                {vendorApplication.status === 'approved' && "Congratulations! Your application has been approved"}
                {vendorApplication.status === 'rejected' && "Your application needs attention"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant={
                  vendorApplication.status === 'pending' ? 'secondary' :
                  vendorApplication.status === 'approved' ? 'default' : 'destructive'
                }>
                  {vendorApplication.status.charAt(0).toUpperCase() + vendorApplication.status.slice(1)}
                </Badge>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/customer/vendor-application">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {vendorApplication.status === 'approved' && profile?.role === 'vendor' && (
                    <Button asChild size="sm">
                      <Link href="/vendor/dashboard">
                        Go to Vendor Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings || 0}</div>
              <p className="text-xs text-muted-foreground">All time transfers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings || 0}</div>
              <p className="text-xs text-muted-foreground">Future transfers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">Account verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2024</div>
              <p className="text-xs text-muted-foreground">Trusted customer</p>
            </CardContent>
          </Card>
        </div>

        {/* My Bookings Section */}
        {bookings && bookings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Recent Bookings</h2>
                <p className="text-muted-foreground">
                  Your latest transfer bookings
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/customer/bookings">
                  View All ({totalBookings})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <BookingsTable bookings={bookings} />
          </div>
        )}

        {/* Empty State for Bookings */}
        {(!bookings || bookings.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start your journey with us by booking your first transfer
              </p>
              <Button asChild>
                <Link href="/">
                  Book a Transfer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Settings & Support */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/customer/profile">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/customer/security">
                    <Shield className="mr-2 h-4 w-4" />
                    Security Settings
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/customer/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notification Preferences
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support & Help</CardTitle>
              <CardDescription>Get assistance when you need it</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-1">Help Center</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Find answers to common questions
                  </p>
                  <Button variant="outline" size="sm">
                    Visit Help Center
                  </Button>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-1">Contact Support</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Get in touch with our support team
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Us
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  )
}
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { requireCustomer } from "@/lib/auth/user-actions"
import {
  Shield,
  Settings,
  Clock,
  User,
  Activity,
  ArrowRight,
  Bell,
  Building2,
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const recentActivities = [
  {
    id: "1",
    action: "Profile updated",
    details: "Phone number changed",
    date: "2024-06-25",
    time: "10:00 AM",
    type: "profile",
  },
  {
    id: "2",
    action: "Password changed",
    details: "Security update completed",
    date: "2024-06-20",
    time: "2:30 PM",
    type: "security",
  },
  {
    id: "3",
    action: "Email verified",
    details: "Primary email confirmed",
    date: "2024-06-15",
    time: "9:00 AM",
    type: "verification",
  },
]

export default async function CustomerDashboard() {
  const user = await requireCustomer()
  const supabase = await createClient()
  
  // Check if user has a vendor application
  const { data: vendorApplication } = await supabase
    .from('vendor_applications')
    .select('status')
    .eq('user_id', user.id)
    .single()
  
  return (
    <CustomerLayout>
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Complete</div>
              <p className="text-xs text-muted-foreground">All details verified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Level</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">High</div>
              <p className="text-xs text-muted-foreground">2FA enabled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Age</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6 mo</div>
              <p className="text-xs text-muted-foreground">Member since Jan 2024</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your account activity log</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/customer/activity">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{activity.action}</p>
                      <Badge
                        variant={
                          activity.type === "security" ? "default" : 
                          activity.type === "verification" ? "secondary" : "outline"
                        }
                      >
                        {activity.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{activity.details}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.date} {activity.time}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Shield, Users, Truck } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Vehicle Service Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive vehicle service management system for administrators, customers, vendors, and drivers
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>
                Manage users, services, and monitor business operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/login">Admin Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Customer</CardTitle>
              <CardDescription>
                Book services, track orders, and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/customer/login">Customer Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>Vendor</CardTitle>
              <CardDescription>
                Manage your services, bookings, and business profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/vendor/login">Vendor Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <Car className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle>Driver</CardTitle>
              <CardDescription>
                View assignments, update status, and manage deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/driver/login">Driver Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto text-sm">
            <div className="p-4">
              <h3 className="font-medium mb-2">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Separate portals for admins, customers, vendors, and drivers
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-2">Real-time Tracking</h3>
              <p className="text-muted-foreground">
                Track bookings, services, and deliveries in real-time
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-medium mb-2">Secure Platform</h3>
              <p className="text-muted-foreground">
                Built with Supabase for secure authentication and data storage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
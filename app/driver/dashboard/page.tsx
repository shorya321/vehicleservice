import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, Calendar, MapPin, Package, LogOut } from 'lucide-react'
import { AnimatedCard } from '@/components/ui/animated-card'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Driver Dashboard',
  description: 'Driver dashboard and trip management',
}

export default async function DriverDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'driver') {
    redirect('/unauthorized')
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Driver Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile.full_name || profile.email}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/logout">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Link>
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <AnimatedCard delay={0.1}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Today&apos;s Trips</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">0</span>
                </div>
                <p className="text-xs text-muted-foreground">No trips scheduled</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Upcoming Trips</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/20">
                    <Calendar className="h-4 w-4 text-sky-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">0</span>
                </div>
                <p className="text-xs text-muted-foreground">Next 7 days</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.3}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Completed Trips</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
                    <Package className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">0</span>
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <Card className="admin-card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Total Distance</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                    <MapPin className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-400">0 km</span>
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
        
        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Schedule</CardTitle>
              <CardDescription>Your trips for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No trips scheduled for today</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your driver account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" disabled>
                View Trip History
              </Button>
              <Button className="w-full" variant="outline" disabled>
                Update Availability
              </Button>
              <Button className="w-full" variant="outline" disabled>
                View Earnings
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/driver/profile">
                  Update Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Notice */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Driver Portal Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The driver portal is currently under development. Trip assignments and management features 
              will be available soon. Please contact your dispatcher for trip information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
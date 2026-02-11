import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Test data functionality removed
import { Database, Trash2, AlertCircle } from "lucide-react"

export default async function TestDataPage() {
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

  // Get current booking count
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  const { count: testCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .like('booking_number', 'TEST-%')

  async function generateData() {
    'use server'
    // Test data generation removed
    redirect('/admin/test-data')
  }

  async function clearData() {
    'use server'
    // Test data clearing removed
    redirect('/admin/test-data')
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Data Generator</h1>
          <p className="text-muted-foreground">
            Generate sample bookings for testing and development
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This tool is for development and testing purposes only.
            Generated bookings will have &quot;TEST-&quot; prefix in their booking numbers.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
              <CardDescription>Current data in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Bookings:</span>
                <span className="font-medium">{count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Test Bookings:</span>
                <span className="font-medium">{testCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Real Bookings:</span>
                <span className="font-medium">{(count || 0) - (testCount || 0)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generate Test Data</CardTitle>
              <CardDescription>Create sample bookings for the last 3 months</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                This will generate approximately 100-150 bookings distributed over the last 90 days with:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Random locations and routes</li>
                  <li>Various booking and payment statuses</li>
                  <li>Realistic price ranges ($30-$300)</li>
                  <li>More bookings on weekends</li>
                </ul>
              </div>
              <form action={generateData}>
                <Button type="submit" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Generate Test Bookings
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Clear Test Data</CardTitle>
              <CardDescription>Remove all test bookings from the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will delete all bookings with &quot;TEST-&quot; prefix. This action cannot be undone.
                </AlertDescription>
              </Alert>
              <form action={clearData}>
                <Button type="submit" variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Test Bookings
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
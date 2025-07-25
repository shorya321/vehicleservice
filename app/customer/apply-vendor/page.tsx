import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { requireCustomer } from "@/lib/auth/user-actions"
import { VendorApplicationForm } from "./components/vendor-application-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Apply to Become a Vendor",
  description: "Start your vehicle rental business with us",
}

export default async function ApplyVendorPage() {
  const user = await requireCustomer()
  const supabase = await createClient()

  // Check if user already has an application
  const { data: existingApplication } = await supabase
    .from('vendor_applications')
    .select('status')
    .eq('user_id', user.id)
    .single()

  // If application exists, redirect to status page
  if (existingApplication) {
    redirect('/customer/vendor-application')
  }

  // Get user profile data to prefill form
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', user.id)
    .single()

  return (
    <CustomerLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Become a Vendor</h1>
          <p className="text-muted-foreground">
            Apply to list your vehicles and start your rental business
          </p>
        </div>

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Before you apply:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Make sure you have all required business information ready</li>
              <li>Your application will be reviewed by our team within 48 hours</li>
              <li>Once approved, you&apos;ll be able to list your vehicles immediately</li>
              <li>There are no fees to join - we only charge a small commission on bookings</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Please provide accurate information about your business. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VendorApplicationForm 
              userId={user.id}
              defaultValues={{
                businessEmail: profile?.email || '',
                businessPhone: profile?.phone || '',
              }}
            />
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            By submitting this application, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/vendor-agreement" className="underline hover:text-primary">
              Vendor Agreement
            </Link>
          </p>
        </div>
      </div>
    </CustomerLayout>
  )
}
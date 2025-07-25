import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CustomerLayout } from "@/components/layout/customer-layout"
import { requireCustomer } from "@/lib/auth/user-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export const metadata = {
  title: "Vendor Application Status",
  description: "Track the status of your vendor application",
}

export default async function VendorApplicationPage() {
  const user = await requireCustomer()
  const supabase = await createClient()

  // Get vendor application with reviewer info
  const { data: application, error } = await supabase
    .from('vendor_applications')
    .select(`
      *,
      reviewer:reviewed_by(full_name, email)
    `)
    .eq('user_id', user.id)
    .single()

  if (error || !application) {
    redirect('/customer/apply-vendor')
  }

  const statusConfig = {
    pending: {
      color: "secondary",
      icon: Clock,
      title: "Application Under Review",
      description: "Your application is being reviewed by our team. We'll notify you within 48 hours.",
    },
    approved: {
      color: "default",
      icon: CheckCircle2,
      title: "Application Approved!",
      description: "Congratulations! Your vendor application has been approved.",
    },
    rejected: {
      color: "destructive",
      icon: XCircle,
      title: "Application Rejected",
      description: "Unfortunately, your application was not approved at this time.",
    },
  } as const

  const status = application.status as keyof typeof statusConfig
  const StatusIcon = statusConfig[status].icon

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Application</h1>
            <p className="text-muted-foreground">
              Track the status of your vendor application
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/customer/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Status Alert */}
        <Alert className={
          status === 'pending' ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950" :
          status === 'approved' ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" :
          "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
        }>
          <StatusIcon className="h-4 w-4" />
          <AlertTitle>{statusConfig[status].title}</AlertTitle>
          <AlertDescription>
            {statusConfig[status].description}
            {status === 'approved' && (
              <div className="mt-4">
                <Button asChild>
                  <Link href="/vendor/profile">
                    Complete Your Vendor Profile
                  </Link>
                </Button>
              </div>
            )}
            {status === 'rejected' && application.rejection_reason && (
              <div className="mt-4 p-4 bg-background rounded-lg border">
                <p className="font-medium mb-1">Reason for rejection:</p>
                <p className="text-sm">{application.rejection_reason}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>
                  Submitted on {format(new Date(application.created_at), 'PPP')}
                </CardDescription>
              </div>
              <Badge variant={statusConfig[status].color as any}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Information */}
            <div>
              <h3 className="font-semibold mb-4">Business Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Business Name</p>
                      <p className="text-sm text-muted-foreground">{application.business_name}</p>
                    </div>
                  </div>

                  {application.business_email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Business Email</p>
                        <p className="text-sm text-muted-foreground">{application.business_email}</p>
                      </div>
                    </div>
                  )}

                  {application.business_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Business Phone</p>
                        <p className="text-sm text-muted-foreground">{application.business_phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {(application.business_address || application.business_city) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Business Location</p>
                        <p className="text-sm text-muted-foreground">
                          {[application.business_address, application.business_city]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.business_description && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Business Description</p>
                        <p className="text-sm text-muted-foreground">{application.business_description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Review Information */}
            {application.reviewed_at && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Review Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Reviewed On</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(application.reviewed_at), 'PPP')}
                      </p>
                    </div>
                  </div>

                  {application.reviewer && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Reviewed By</p>
                        <p className="text-sm text-muted-foreground">
                          {application.reviewer.full_name || application.reviewer.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {application.admin_notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Admin Notes</p>
                        <p className="text-sm text-muted-foreground">{application.admin_notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions based on status */}
        {status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Application Actions</CardTitle>
              <CardDescription>
                You can update your application while it&apos;s under review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Need to update your documents or business information? You can edit your application 
                until it&apos;s reviewed by our team.
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/customer/vendor-application/edit">
                    Edit Application
                  </Link>
                </Button>
                <Button variant="outline">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {status === 'rejected' && (
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                You can address the issues and submit a new application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Please review the rejection reason carefully and ensure you meet all requirements 
                before submitting a new application. If you have questions, please contact our support team.
              </p>
              <div className="flex gap-4">
                <Button variant="outline">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  )
}
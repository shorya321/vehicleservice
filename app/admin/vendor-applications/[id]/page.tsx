import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VendorApplicationActions } from "./components/vendor-application-actions"
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  User,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  CreditCard,
  FileCheck,
  AlertCircle,
  BanknoteIcon,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function VendorApplicationReviewPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get application with user and reviewer info
  const { data: application, error } = await supabase
    .from('vendor_applications')
    .select(`
      *,
      user:user_id(
        id,
        email,
        full_name,
        phone,
        created_at,
        email_verified,
        status
      ),
      reviewer:reviewed_by(full_name, email)
    `)
    .eq('id', id)
    .single()

  if (error || !application) {
    notFound()
  }

  const statusConfig = {
    pending: {
      color: "secondary",
      icon: Clock,
      label: "Pending Review",
    },
    approved: {
      color: "default",
      icon: CheckCircle2,
      label: "Approved",
    },
    rejected: {
      color: "destructive",
      icon: XCircle,
      label: "Rejected",
    },
  } as const

  const status = application.status as keyof typeof statusConfig
  const StatusIcon = statusConfig[status].icon

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Review Vendor Application</h1>
            <p className="text-muted-foreground">
              Review application from {application.business_name}
            </p>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/vendor-applications">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            {/* Business Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Business Information</CardTitle>
                <Badge variant={statusConfig[status].color as any}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig[status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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

                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Submitted On</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(application.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {application.business_description && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Business Description</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.business_description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {application.registration_number && (
                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Business Registration Number</p>
                      <p className="text-sm text-muted-foreground">{application.registration_number}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents & Licenses */}
          <Card>
            <CardHeader>
              <CardTitle>Documents & Licenses</CardTitle>
              <CardDescription>
                Required documentation for vendor verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.documents ? (
                <>
                  {/* Trade License */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Trade License</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Number: {application.documents.trade_license_number || 'Not provided'}
                          </p>
                          {application.documents.trade_license_expiry && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              Expires: {format(new Date(application.documents.trade_license_expiry), 'PPP')}
                              {new Date(application.documents.trade_license_expiry) < new Date() && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Expired
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insurance */}
                  <div className="pt-3 border-t">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Insurance Policy</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Policy Number: {application.documents.insurance_policy_number || 'Not provided'}
                          </p>
                          {application.documents.insurance_expiry && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              Expires: {format(new Date(application.documents.insurance_expiry), 'PPP')}
                              {new Date(application.documents.insurance_expiry) < new Date() && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Expired
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No documents provided</p>
              )}
            </CardContent>
          </Card>

          {/* Banking Details */}
          {application.banking_details && Object.values(application.banking_details).some(v => v) && (
            <Card>
              <CardHeader>
                <CardTitle>Banking Details</CardTitle>
                <CardDescription>
                  Payment account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.banking_details.bank_name && (
                  <div className="flex items-start gap-3">
                    <BanknoteIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Bank Name</p>
                      <p className="text-sm text-muted-foreground">{application.banking_details.bank_name}</p>
                    </div>
                  </div>
                )}

                {application.banking_details.account_holder_name && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Account Holder</p>
                      <p className="text-sm text-muted-foreground">{application.banking_details.account_holder_name}</p>
                    </div>
                  </div>
                )}

                {application.banking_details.account_number && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Account Number</p>
                      <p className="text-sm text-muted-foreground font-mono">{application.banking_details.account_number}</p>
                    </div>
                  </div>
                )}

                {application.banking_details.iban && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">IBAN</p>
                      <p className="text-sm text-muted-foreground font-mono">{application.banking_details.iban}</p>
                    </div>
                  </div>
                )}

                {application.banking_details.swift_code && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">SWIFT Code</p>
                      <p className="text-sm text-muted-foreground font-mono">{application.banking_details.swift_code}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review History */}
          {(application.reviewed_at || application.rejection_reason || application.admin_notes) && (
            <Card>
              <CardHeader>
                <CardTitle>Review History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {application.reviewed_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Reviewed On</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(application.reviewed_at), 'PPP')} by{" "}
                        {application.reviewer?.full_name || application.reviewer?.email || 'Admin'}
                      </p>
                    </div>
                  </div>
                )}

                {application.rejection_reason && (
                  <div className="flex items-start gap-3">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Rejection Reason</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.rejection_reason}
                      </p>
                    </div>
                  </div>
                )}

                {application.admin_notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Admin Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.admin_notes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {application.user?.full_name || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{application.user?.email}</p>
                </div>
              </div>

              {application.user?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{application.user.phone}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account Status</span>
                  <Badge variant={application.user?.status === 'active' ? 'default' : 'secondary'}>
                    {application.user?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email Verified</span>
                  <Badge variant={application.user?.email_verified ? 'default' : 'secondary'}>
                    {application.user?.email_verified ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>
                    {application.user?.created_at
                      ? format(new Date(application.user.created_at), 'MMM yyyy')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Review and take action on this application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VendorApplicationActions applicationId={id} />
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
  )
}
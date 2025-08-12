import Link from "next/link"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, AlertCircle } from "lucide-react"
import { VendorApplicationsFilters } from "./vendor-applications-filters"
import { VendorApplicationsPagination } from "./vendor-applications-pagination"
import { getVendorApplications } from "../actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface VendorApplicationsTableProps {
  search?: string
  status?: string
  page: number
}

export async function VendorApplicationsTable({
  search,
  status,
  page = 1,
}: VendorApplicationsTableProps) {
  const limit = 10
  
  // Fetch vendor applications using the server action
  const { data: applications, count, error } = await getVendorApplications({
    search,
    status,
    page,
    limit
  })

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  const totalPages = Math.ceil((count || 0) / limit)

  const statusConfig = {
    pending: { variant: "secondary" as const, label: "Pending" },
    approved: { variant: "default" as const, label: "Approved" },
    rejected: { variant: "destructive" as const, label: "Rejected" },
  }

  return (
    <div className="space-y-4">
      <VendorApplicationsFilters 
        search={search}
        status={status}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>Registration No.</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {search || (status && status !== 'all') 
                      ? "No applications found matching your filters" 
                      : "No vendor applications yet"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              applications?.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {application.business_name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {application.registration_number ? (
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {application.registration_number}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{application.user?.full_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{application.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {application.business_email && (
                        <p>{application.business_email}</p>
                      )}
                      {application.business_phone && (
                        <p className="text-muted-foreground">{application.business_phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[application.status as keyof typeof statusConfig]?.variant}>
                      {statusConfig[application.status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{format(new Date(application.created_at), 'MMM d, yyyy')}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(application.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {application.reviewed_at ? (
                      <div className="text-sm">
                        <p>{format(new Date(application.reviewed_at), 'MMM d, yyyy')}</p>
                        <p className="text-muted-foreground">
                          {application.reviewer?.full_name || 'System'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not reviewed</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/vendor-applications/${application.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <VendorApplicationsPagination
        currentPage={page}
        totalPages={totalPages}
        baseUrl="/admin/vendor-applications"
        searchParams={{ search, status }}
      />
    </div>
  )
}
import { createClient } from "@/lib/supabase/server"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, Search } from "lucide-react"
import { VendorApplicationsFilters } from "./vendor-applications-filters"
import { VendorApplicationsPagination } from "./vendor-applications-pagination"

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
  const supabase = await createClient()
  const limit = 10
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('vendor_applications')
    .select(`
      *,
      user:user_id(id, email, full_name, phone),
      reviewer:reviewed_by(full_name, email)
    `, { count: 'exact' })

  // Apply filters
  if (search) {
    query = query.or(`business_name.ilike.%${search}%,user.email.ilike.%${search}%,user.full_name.ilike.%${search}%`)
  }

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Order and pagination
  const { data: applications, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching applications:', error)
    return <div>Error loading applications</div>
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
                          by {application.reviewer?.full_name || application.reviewer?.email || 'Admin'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not reviewed</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/vendor-applications/${application.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Review
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
        totalCount={count || 0}
      />
    </div>
  )
}
import { AlertCircle } from "lucide-react"
import { VendorApplicationsFilters } from "./vendor-applications-filters"
import { VendorApplicationsPagination } from "./vendor-applications-pagination"
import { VendorApplicationsTableClient } from "./vendor-applications-table-client"
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

  return (
    <div className="space-y-4">
      <VendorApplicationsFilters
        search={search}
        status={status}
      />

      <VendorApplicationsTableClient applications={applications} />

      <VendorApplicationsPagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={count || 0}
      />
    </div>
  )
}

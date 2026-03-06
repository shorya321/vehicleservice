'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Eye, Trash2, ClipboardList } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { deleteVendorApplication } from '../actions'
import { BulkActionsBar } from './bulk-actions-bar'
import { EmptyState } from '@/components/ui/empty-state'

interface VendorApplicationsTableClientProps {
  applications: Array<{
    id: string
    business_name: string
    registration_number: string | null
    business_email: string | null
    business_phone: string | null
    status: string | null
    created_at: string
    reviewed_at: string | null
    user: { id: string; email: string; full_name: string | null } | null
    reviewer: { id: string; email: string; full_name: string | null } | null
  }>
}

const statusConfig = {
  pending: { variant: 'secondary' as const, label: 'Pending' },
  approved: { variant: 'default' as const, label: 'Approved' },
  rejected: { variant: 'destructive' as const, label: 'Rejected' },
}

export function VendorApplicationsTableClient({
  applications,
}: VendorApplicationsTableClientProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(applications.map(a => a.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectApplication = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) { newSelected.add(id) } else { newSelected.delete(id) }
    setSelectedIds(newSelected)
  }

  const isAllSelected = applications.length > 0 && selectedIds.size === applications.length
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteVendorApplication(deletingId)
      toast.success('Application deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete application')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {selectedIds.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            selectedIds={Array.from(selectedIds)}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        )}
        <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
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
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-[400px] p-0">
                  <EmptyState
                    icon={ClipboardList}
                    title="No Applications Found"
                    description="There are no vendor applications matching your current filters. Try adjusting your search criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(application.id)}
                      onCheckedChange={(checked) => handleSelectApplication(application.id, checked as boolean)}
                      aria-label="Select application"
                      className="translate-y-[2px]"
                    />
                  </TableCell>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendor-applications/${application.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingId(application.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={() => setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vendor application? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

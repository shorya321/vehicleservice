'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusPill } from '@/components/admin/ui/status-pill'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsBar } from '@/components/admin/ui/bulk-actions-bar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import type { ServiceCode } from '../actions'
import {
  toggleServiceCodeStatus,
  deleteServiceCode,
  bulkToggleServiceCodeStatus,
  bulkDeleteServiceCodes,
} from '../actions'

interface ServiceCodesTableProps {
  serviceCodes: ServiceCode[]
}

export function ServiceCodesTable({ serviceCodes }: ServiceCodesTableProps) {
  const router = useRouter()
  const [deleteCode, setDeleteCode] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Only rows on this page count, so a filter or page change drops stale picks.
  const selectedCodes = serviceCodes.filter((sc) => selected.has(sc.code)).map((sc) => sc.code)
  const isAllSelected = serviceCodes.length > 0 && selectedCodes.length === serviceCodes.length
  const isIndeterminate = selectedCodes.length > 0 && !isAllSelected

  function handleSelect(code: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(code)
      else next.delete(code)
      return next
    })
  }

  async function handleToggle(code: string, currentActive: boolean | null) {
    const result = await toggleServiceCodeStatus(code, !currentActive)
    if (result.success) {
      toast.success(`Service code ${code} ${!currentActive ? 'activated' : 'deactivated'}`)
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  async function handleDelete() {
    if (!deleteCode) return
    setIsDeleting(true)
    const result = await deleteServiceCode(deleteCode)
    setIsDeleting(false)
    setDeleteCode(null)

    if (result.success) {
      toast.success(`Service code ${deleteCode} deleted`)
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
  }

  if (serviceCodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Tag className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No service codes found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first service code to get started
        </p>
        <Button asChild>
          <Link href="/admin/service-codes/new">Create Service Code</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedCodes.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedCodes.length}
          noun={['service code', 'service codes']}
          onClearSelection={() => setSelected(new Set())}
          onSetStatus={(isActive) => bulkToggleServiceCodeStatus(selectedCodes, isActive)}
          onDelete={() => bulkDeleteServiceCodes(selectedCodes)}
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                  onCheckedChange={(checked) =>
                    setSelected(checked === true ? new Set(serviceCodes.map((sc) => sc.code)) : new Set())
                  }
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="w-[120px]">Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[140px]">Service Type</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceCodes.map((sc) => (
              <TableRow key={sc.code} data-state={selected.has(sc.code) ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(sc.code)}
                    onCheckedChange={(checked) => handleSelect(sc.code, checked === true)}
                    aria-label={`Select ${sc.code}`}
                    className="translate-y-[2px]"
                  />
                </TableCell>
                <TableCell>
                  <span className="font-mono font-bold text-sm">{sc.code}</span>
                </TableCell>
                <TableCell>{sc.description}</TableCell>
                <TableCell>
                  <StatusPill tone="neutral" className="capitalize">{sc.service_type}</StatusPill>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={sc.is_active === true}
                    aria-label={`${sc.code} active`}
                    onCheckedChange={() => handleToggle(sc.code, sc.is_active)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/service-codes/${sc.code}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteCode(sc.code)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteCode} onOpenChange={() => setDeleteCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteCode}</strong>? This
              action cannot be undone. Codes in use by existing bookings cannot
              be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

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
import { Badge } from '@/components/ui/badge'
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
import { LocationTypeRecord } from '@/lib/types/location-type'
import { getLocationTypeIcon } from '@/lib/utils/location-type-utils'
import {
  toggleLocationTypeStatus,
  deleteLocationType,
  bulkToggleLocationTypeStatus,
  bulkDeleteLocationTypes,
} from '../actions'

interface LocationTypesTableProps {
  locationTypes: LocationTypeRecord[]
}

export function LocationTypesTable({ locationTypes }: LocationTypesTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Only rows on this page count, so a filter or page change drops stale picks.
  const selectedIds = locationTypes.filter((lt) => selected.has(lt.id)).map((lt) => lt.id)
  const isAllSelected = locationTypes.length > 0 && selectedIds.length === locationTypes.length
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected

  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleToggle(id: string, currentActive: boolean) {
    const result = await toggleLocationTypeStatus(id, !currentActive)
    if (result.success) {
      toast.success(`Location type ${!currentActive ? 'activated' : 'deactivated'}`)
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    const result = await deleteLocationType(deleteId)
    setIsDeleting(false)
    setDeleteId(null)

    if (result.success) {
      toast.success('Location type deleted')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete')
    }
  }

  const deleteTarget = locationTypes.find((lt) => lt.id === deleteId)

  if (locationTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Tag className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No location types found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first location type to get started
        </p>
        <Button asChild>
          <Link href="/admin/location-types/new">Create Location Type</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          noun={['location type', 'location types']}
          onClearSelection={() => setSelected(new Set())}
          onSetStatus={(isActive) => bulkToggleLocationTypeStatus(selectedIds, isActive)}
          onDelete={() => bulkDeleteLocationTypes(selectedIds)}
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
                    setSelected(checked === true ? new Set(locationTypes.map((lt) => lt.id)) : new Set())
                  }
                  aria-label="Select all"
                  className="translate-y-[2px]"
                />
              </TableHead>
              <TableHead className="w-[60px]">Icon</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-[100px]">Slug</TableHead>
              <TableHead className="w-[80px]">Abbrev</TableHead>
              <TableHead className="w-[100px]">Preview</TableHead>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locationTypes.map((lt) => (
              <TableRow key={lt.id} data-state={selected.has(lt.id) ? 'selected' : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(lt.id)}
                    onCheckedChange={(checked) => handleSelect(lt.id, checked === true)}
                    aria-label={`Select ${lt.label}`}
                    className="translate-y-[2px]"
                  />
                </TableCell>
                <TableCell>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-md ${lt.color_config?.bg || ''}`}>
                    {getLocationTypeIcon(lt.icon_name, `h-4 w-4 ${lt.color_config?.color || ''}`)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{lt.label}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{lt.name}</code>
                </TableCell>
                <TableCell>
                  <span className="font-mono font-bold">{lt.abbreviation}</span>
                </TableCell>
                <TableCell>
                  <Badge className={lt.color_config?.badgeClass || ''}>
                    {lt.label}
                  </Badge>
                </TableCell>
                <TableCell>{lt.sort_order}</TableCell>
                <TableCell>
                  <Switch
                    checked={lt.is_active}
                    aria-label={`${lt.name} active`}
                    onCheckedChange={() => handleToggle(lt.id, lt.is_active)}
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
                        <Link href={`/admin/location-types/${lt.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(lt.id)}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.label}</strong>?
              This action cannot be undone. Types with existing locations cannot be deleted.
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

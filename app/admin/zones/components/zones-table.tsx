'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash, MapPin, Check, X, Map } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsBar } from './bulk-actions-bar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Zone, deleteZone, toggleZoneStatus } from '../actions'
import { EmptyState } from '@/components/ui/empty-state'
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

interface ZonesTableProps {
  zones: Zone[]
}

export function ZonesTable({ zones }: ZonesTableProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(zones.map(z => z.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const isAllSelected = zones.length > 0 && selectedIds.size === zones.length
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected

  const handleStatusToggle = async (zone: Zone) => {
    setLoadingStates(prev => ({ ...prev, [zone.id]: true }))
    
    const result = await toggleZoneStatus(zone.id, !zone.is_active)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Zone ${!zone.is_active ? 'activated' : 'deactivated'} successfully`)
      router.refresh()
    }
    
    setLoadingStates(prev => ({ ...prev, [zone.id]: false }))
  }

  const handleDelete = async () => {
    if (!zoneToDelete) return

    const result = await deleteZone(zoneToDelete.id)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Zone deleted successfully')
      router.refresh()
    }
    
    setDeleteDialogOpen(false)
    setZoneToDelete(null)
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
        <div className="rounded-md border">
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
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Locations</TableHead>
              <TableHead className="text-center">Sort Order</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-[400px] p-0">
                  <EmptyState
                    icon={Map}
                    title="No Zones Found"
                    description="There are no zones matching your current filters. Try adjusting your search criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(zone.id)}
                      onCheckedChange={(checked) => handleSelect(zone.id, checked as boolean)}
                      aria-label="Select zone"
                      className="translate-y-[2px]"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>
                    <code className="text-sm">{zone.slug}</code>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {zone.description || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      <MapPin className="mr-1 h-3 w-3" />
                      {zone.location_count || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{zone.sort_order}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={zone.is_active}
                        onCheckedChange={() => handleStatusToggle(zone)}
                        disabled={loadingStates[zone.id]}
                      />
                      {zone.is_active ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
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
                        <DropdownMenuSeparator />
                        <Link href={`/admin/zones/${zone.id}`}>
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/admin/zones/${zone.id}/locations`}>
                          <DropdownMenuItem>
                            <MapPin className="mr-2 h-4 w-4" />
                            Manage Locations
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setZoneToDelete(zone)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the zone &quot;{zoneToDelete?.name}&quot;.
              {zoneToDelete?.location_count && zoneToDelete.location_count > 0 && (
                <span className="block mt-2 font-semibold text-destructive">
                  This zone has {zoneToDelete.location_count} location(s) assigned and cannot be deleted.
                </span>
              )}
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
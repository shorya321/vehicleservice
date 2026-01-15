'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { toast } from "sonner"
import { Addon, deleteAddon, toggleAddonStatus } from "../actions"
import { formatCurrency } from "@/lib/utils"

interface AddonsTableProps {
  addons: Addon[]
}

// Dynamic icon component
function AddonIcon({ iconName }: { iconName: string }) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  if (!IconComponent) return null
  return <IconComponent className="h-4 w-4" />
}

export function AddonsTable({ addons }: AddonsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAddonStatus(id, !currentStatus)
      toast.success(`Addon ${currentStatus ? 'deactivated' : 'activated'} successfully`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      await deleteAddon(deleteId)
      toast.success('Addon deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete addon')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Child Safety':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Luggage':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
      case 'Comfort':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (addons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No addons found. Create your first addon to get started.
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.map((addon) => (
              <TableRow key={addon.id}>
                <TableCell>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <AddonIcon iconName={addon.icon} />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{addon.name}</div>
                    {addon.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {addon.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getCategoryColor(addon.category)}>
                    {addon.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {addon.price === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatCurrency(addon.price)
                    )}
                  </div>
                  {addon.pricing_type === 'per_unit' && (
                    <div className="text-xs text-muted-foreground">
                      per unit (max {addon.max_quantity})
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={addon.pricing_type === 'fixed' ? 'default' : 'secondary'}>
                    {addon.pricing_type === 'fixed' ? 'Fixed' : 'Per Unit'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={addon.is_active ? 'default' : 'outline'}>
                    {addon.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {addon.display_order}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/addons/${addon.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(addon.id, addon.is_active)}
                      >
                        {addon.is_active ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(addon.id)}
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
            <AlertDialogTitle>Delete Addon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this addon? This action cannot be undone.
              If this addon is used in any bookings, deletion will be prevented.
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
    </>
  )
}

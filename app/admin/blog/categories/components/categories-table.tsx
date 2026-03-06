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
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight, FolderOpen } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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
import { toast } from "sonner"
import { BlogCategory, deleteBlogCategory, toggleBlogCategoryStatus } from "../actions"
import { BulkActionsBar } from "./bulk-actions-bar"
import { EmptyState } from "@/components/ui/empty-state"

interface CategoriesTableProps {
  categories: BlogCategory[]
}

export function BlogCategoriesTable({ categories }: CategoriesTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(categories.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectCategory = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) { newSelected.add(id) } else { newSelected.delete(id) }
    setSelectedIds(newSelected)
  }

  const isAllSelected = categories.length > 0 && selectedIds.size === categories.length
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteBlogCategory(deletingId)
      toast.success("Category deleted successfully")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete category")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    setTogglingId(id)
    try {
      await toggleBlogCategoryStatus(id, isActive)
      toast.success(`Category ${isActive ? 'activated' : 'deactivated'} successfully`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update category status")
    } finally {
      setTogglingId(null)
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
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-[400px] p-0">
                  <EmptyState
                    icon={FolderOpen}
                    title="No Categories Found"
                    description="There are no categories matching your current filters. Try adjusting your search criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(cat.id)}
                      onCheckedChange={(checked) => handleSelectCategory(cat.id, checked as boolean)}
                      aria-label="Select category"
                      className="translate-y-[2px]"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p>{cat.name}</p>
                      <p className="text-sm text-muted-foreground">{cat.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-sm text-muted-foreground truncate">
                      {cat.description || '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={cat.is_active || false}
                      onCheckedChange={(checked) => handleToggleStatus(cat.id, checked)}
                      disabled={togglingId === cat.id}
                    />
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
                          <Link href={`/admin/blog/categories/${cat.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Category
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(cat.id, !cat.is_active)}
                          disabled={togglingId === cat.id}
                        >
                          {cat.is_active ? (
                            <ToggleRight className="mr-2 h-4 w-4" />
                          ) : (
                            <ToggleLeft className="mr-2 h-4 w-4" />
                          )}
                          {cat.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingId(cat.id)}
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

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This category cannot be deleted if blog posts are using it.
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

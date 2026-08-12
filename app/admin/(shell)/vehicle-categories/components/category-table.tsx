"use client"

import { useState } from "react"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { deleteCategory } from "../actions"
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

interface CategoryWithUsage extends VehicleCategory {
  usage_count?: number
}

interface CategoryTableProps {
  categories: CategoryWithUsage[]
  selectedCategories: string[]
  onSelectAll: (checked: boolean) => void
  onSelectCategory: (categoryId: string, checked: boolean) => void
}

export function CategoryTable({ 
  categories, 
  selectedCategories,
  onSelectAll,
  onSelectCategory,
}: CategoryTableProps) {
  const [deleteCategoryId, setDeleteCategoryId] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const allSelected =
    categories.length > 0 && 
    categories.every(category => selectedCategories.includes(category.id))
  
  const someSelected = 
    categories.some(category => selectedCategories.includes(category.id)) && 
    !allSelected

  const handleDelete = async () => {
    if (!deleteCategoryId) return
    setIsDeleting(true)
    try {
      const result = await deleteCategory(deleteCategoryId.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Category "${deleteCategoryId.name}" deleted successfully`)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setDeleteCategoryId(null)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Tag className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No categories found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get started by creating your first vehicle category.
        </p>
        <Button asChild>
          <Link href="/admin/vehicle-categories/new">
            Add Category
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
                className="translate-y-[2px]"
                {...(someSelected && { "data-state": "indeterminate" })}
              />
            </TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Sort Order</TableHead>
            <TableHead className="text-center">Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <Checkbox
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => 
                    onSelectCategory(category.id, checked as boolean)
                  }
                  aria-label="Select row"
                  className="translate-y-[2px]"
                />
              </TableCell>
              <TableCell>
                <div className="relative h-10 w-16 overflow-hidden rounded-md bg-muted">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {category.description || "-"}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="min-w-[3rem] justify-center">
                  {category.sort_order || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="min-w-[4rem] justify-center">
                  {category.usage_count || 0} vehicles
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/vehicle-categories/${category.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={(category.usage_count || 0) > 0}
                      onClick={() => setDeleteCategoryId({ id: category.id, name: category.name })}
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

    <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{deleteCategoryId?.name}&quot;? This action cannot be undone.
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
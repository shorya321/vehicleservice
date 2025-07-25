"use client"

import { useState } from "react"
import { CategoryTable } from "./category-table"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { bulkDeleteCategories } from "../actions"
import { Trash2 } from "lucide-react"
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

interface CategoryTableWithBulkProps {
  categories: CategoryWithUsage[]
}

export function CategoryTableWithBulk({ categories }: CategoryTableWithBulkProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select categories that can be deleted (no usage)
      const selectableIds = categories
        .filter(cat => (cat.usage_count || 0) === 0)
        .map(cat => cat.id)
      setSelectedCategories(selectableIds)
    } else {
      setSelectedCategories([])
    }
  }

  const handleSelectCategory = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId])
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
    }
  }

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await bulkDeleteCategories(selectedCategories)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${selectedCategories.length} categories deleted successfully`)
        setSelectedCategories([])
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const selectedCount = selectedCategories.length
  const hasSelection = selectedCount > 0

  return (
    <div className="space-y-4">
      {hasSelection && (
        <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'category' : 'categories'} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}

      <CategoryTable
        categories={categories}
        selectedCategories={selectedCategories}
        onSelectAll={handleSelectAll}
        onSelectCategory={handleSelectCategory}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Categories</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected {selectedCount === 1 ? 'category' : 'categories'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
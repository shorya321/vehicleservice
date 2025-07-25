"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteCategory } from "../../actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteButtonProps {
  categoryId: string
  categoryName: string
  usageCount: number
}

export function DeleteButton({ categoryId, categoryName, usageCount }: DeleteButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteCategory(categoryId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Category "${categoryName}" deleted successfully`)
        router.push('/admin/vehicle-categories')
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={isDeleting || usageCount > 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Category
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            {usageCount > 0 ? (
              <>
                Cannot delete &quot;{categoryName}&quot; because {usageCount} {usageCount === 1 ? 'vehicle is' : 'vehicles are'} using this category. 
                Please reassign these vehicles to other categories first.
              </>
            ) : (
              <>
                Are you sure you want to delete &quot;{categoryName}&quot;? This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {usageCount === 0 && (
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
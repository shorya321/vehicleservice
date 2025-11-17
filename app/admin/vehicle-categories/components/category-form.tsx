"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { createCategory, updateCategory, CategoryFormData } from "../actions"
import { Loader2, Save } from "lucide-react"
import { ImageUpload } from "./image-upload"

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  sort_order: z.number().min(0, "Sort order must be 0 or greater").optional(),
})

interface CategoryFormProps {
  initialData?: VehicleCategory
}

export function CategoryForm({ initialData }: CategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      sort_order: initialData?.sort_order || 999,
    },
  })

  const handleImageChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  async function onSubmit(values: CategoryFormData) {
    setIsLoading(true)
    
    try {
      let imageBase64: string | null = null
      
      if (imageFile) {
        const reader = new FileReader()
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(imageFile)
        })
      }

      const formData: CategoryFormData = {
        ...values,
        imageBase64: imageBase64,
        existingImage: !imageBase64 && imagePreview ? imagePreview : null,
      }

      const result = initialData
        ? await updateCategory(initialData.id, formData)
        : await createCategory(formData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(initialData ? "Category updated" : "Category created")
        router.push('/admin/vehicle-categories')
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Economy" {...field} />
              </FormControl>
              <FormDescription>
                The display name for this vehicle category
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Budget-friendly vehicles for cost-conscious travelers"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of this category (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="999"
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Lower numbers appear first in lists
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          label="Category Image"
          description="Upload an image for this category (optional)"
          value={imagePreview || undefined}
          onChange={handleImageChange}
          onRemove={handleImageRemove}
          disabled={isLoading}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/vehicle-categories')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {initialData ? "Update Category" : "Create Category"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
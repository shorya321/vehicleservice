'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createBlogCategory, updateBlogCategory, BlogCategory, BlogCategoryFormData } from "../actions"
import { ImageUpload } from "@/app/admin/vehicle-types/components/image-upload"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().optional(),
  sort_order: z.coerce.number().optional(),
  is_active: z.boolean().default(true),
})

interface CategoryFormProps {
  category?: BlogCategory
}

export function BlogCategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(category?.image_url || null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      sort_order: category?.sort_order || undefined,
      is_active: category?.is_active ?? true,
    },
  })

  const handleImageChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      let imageBase64: string | null = null
      if (imageFile) {
        const reader = new FileReader()
        imageBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(imageFile)
        })
      }

      const formData: BlogCategoryFormData = {
        ...data,
        imageBase64,
        existingImage: !imageBase64 && imagePreview ? imagePreview : null,
      }

      if (category) {
        await updateBlogCategory(category.id, formData)
        toast.success("Category updated successfully")
      } else {
        await createBlogCategory(formData)
        toast.success("Category created successfully")
      }
      router.push("/admin/blog/categories")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Travel Tips"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      if (!category) {
                        form.setValue('slug', generateSlug(e.target.value))
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="travel-tips" {...field} />
                </FormControl>
                <FormDescription>Used in URLs</FormDescription>
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
                  <Input type="number" placeholder="0" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Lower numbers appear first</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Category description" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          label="Category Image"
          description="Optional category image. Recommended: 600x400px"
          value={imagePreview}
          onChange={handleImageChange}
          onRemove={handleImageRemove}
          multiple={false}
          maxSize={5}
          disabled={isSubmitting}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>Show this category on the public blog</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {category ? "Update" : "Create"} Category
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/blog/categories")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

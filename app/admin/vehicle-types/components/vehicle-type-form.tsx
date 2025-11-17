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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { VehicleTypeWithCategory } from "@/lib/types/vehicle"
import { createVehicleType, updateVehicleType, VehicleTypeFormData } from "../actions"
import { ImageUpload } from "./image-upload"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().optional(),
  category_id: z.string().optional(),
  passenger_capacity: z.coerce.number().min(1, "Passenger capacity must be at least 1"),
  luggage_capacity: z.coerce.number().min(0, "Luggage capacity cannot be negative"),
  price_multiplier: z.coerce.number().min(0.1, "Price multiplier must be at least 0.1").max(10, "Price multiplier cannot exceed 10").optional(),
  sort_order: z.coerce.number().optional(),
  is_active: z.boolean().default(true),
})

interface VehicleTypeFormProps {
  vehicleType?: VehicleTypeWithCategory
  categories: Array<{ id: string; name: string }>
}

export function VehicleTypeForm({ vehicleType, categories }: VehicleTypeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(vehicleType?.image_url || null)

  const form = useForm<VehicleTypeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: vehicleType?.name || "",
      slug: vehicleType?.slug || "",
      description: vehicleType?.description || "",
      category_id: vehicleType?.category_id || "",
      passenger_capacity: vehicleType?.passenger_capacity || 4,
      luggage_capacity: vehicleType?.luggage_capacity || 2,
      price_multiplier: vehicleType?.price_multiplier || 1.0,
      sort_order: vehicleType?.sort_order || undefined,
      is_active: vehicleType?.is_active ?? true,
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

  const onSubmit = async (data: VehicleTypeFormData) => {
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

      const formData: VehicleTypeFormData & { imageBase64?: string | null; existingImage?: string | null } = {
        ...data,
        imageBase64: imageBase64,
        existingImage: !imageBase64 && imagePreview ? imagePreview : null,
      }

      if (vehicleType) {
        await updateVehicleType(vehicleType.id, formData)
        toast.success("Vehicle type updated successfully")
      } else {
        await createVehicleType(formData)
        toast.success("Vehicle type created successfully")
      }
      router.push("/admin/vehicle-types")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
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
                    placeholder="e.g., Economy, Comfort, Minibus"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      if (!vehicleType) {
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
                  <Input placeholder="e.g., economy, comfort, minibus" {...field} />
                </FormControl>
                <FormDescription>
                  Used in URLs. Must be lowercase with hyphens.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Associate this type with a vehicle category
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
                    placeholder="e.g., 1, 2, 3"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Lower numbers appear first
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passenger_capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passenger Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 4, 6, 8"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of passengers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="luggage_capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Luggage Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 2, 3, 4"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Number of luggage pieces
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price_multiplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Multiplier</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    placeholder="e.g., 1.0, 1.5, 2.0"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Multiplier applied to zone base prices (e.g., 1.5 = 50% more expensive)
                </FormDescription>
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
                <Textarea
                  placeholder="Brief description of this vehicle type"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <div className="space-y-2">
          <ImageUpload
            label="Vehicle Type Image"
            description="Upload an image that represents this vehicle type. Recommended size: 600x400px"
            value={imagePreview}
            onChange={handleImageChange}
            onRemove={handleImageRemove}
            multiple={false}
            maxSize={5}
            disabled={isSubmitting}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Make this vehicle type available for selection
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {vehicleType ? "Update" : "Create"} Vehicle Type
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/vehicle-types")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
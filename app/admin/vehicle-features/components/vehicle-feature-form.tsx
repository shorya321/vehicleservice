"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { VehicleFeature, FeatureCategory } from "@/lib/types/vehicle-feature"
import { createVehicleFeature, updateVehicleFeature } from "../actions"
import { Loader2, Save } from "lucide-react"

const featureSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  icon: z.string().optional(),
  category: z.enum(['safety', 'comfort', 'technology', 'entertainment', 'convenience', 'performance']).optional(),
  description: z.string().optional(),
  sort_order: z.number().min(0, "Sort order must be 0 or greater"),
  is_active: z.boolean(),
})

type FeatureFormData = z.infer<typeof featureSchema>

interface VehicleFeatureFormProps {
  initialData?: VehicleFeature
}

const categories: { value: FeatureCategory; label: string }[] = [
  { value: 'safety', label: 'Safety' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'technology', label: 'Technology' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'convenience', label: 'Convenience' },
  { value: 'performance', label: 'Performance' },
]

export function VehicleFeatureForm({ initialData }: VehicleFeatureFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      icon: initialData?.icon || "",
      category: initialData?.category as FeatureCategory || undefined,
      description: initialData?.description || "",
      sort_order: initialData?.sort_order || 0,
      is_active: initialData?.is_active ?? true,
    },
  })

  // Auto-generate slug from name
  const watchName = form.watch("name")
  const handleNameChange = (name: string) => {
    if (!initialData) { // Only auto-generate for new features
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      form.setValue('slug', slug)
    }
  }

  async function onSubmit(values: FeatureFormData) {
    setIsLoading(true)
    
    try {
      const result = initialData
        ? await updateVehicleFeature(initialData.id, values)
        : await createVehicleFeature(values)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(initialData ? "Feature updated successfully" : "Feature created successfully")
        router.push('/admin/vehicle-features')
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
        <Card>
          <CardHeader>
            <CardTitle>Feature Details</CardTitle>
            <CardDescription>
              Configure the feature properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="GPS Navigation" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleNameChange(e.target.value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      The display name of the feature
                    </FormDescription>
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
                      <Input placeholder="gps-navigation" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier (auto-generated)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Group features by category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input placeholder="navigation" {...field} />
                    </FormControl>
                    <FormDescription>
                      Lucide icon name (optional)
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
                      placeholder="Built-in GPS navigation system with real-time traffic updates"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description for the feature
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Make this feature available for selection
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
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/vehicle-features')}
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
                {initialData ? "Update Feature" : "Create Feature"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
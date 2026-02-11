"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Vehicle, VehicleFormData, VehicleType } from "@/lib/types/vehicle"
import { VehicleCategory } from "@/lib/types/vehicle-category"
import { createVehicle, updateVehicle, getVehicleCategories, getVehicleTypesByCategory } from "../actions"
import { Loader2, Save, Check } from "lucide-react"
import { ImageUpload } from "./image-upload"

const currentYear = new Date().getFullYear()

const vehicleSchema = z.object({
  make: z.string().min(2, "Make must be at least 2 characters"),
  model: z.string().min(2, "Model must be at least 2 characters"),
  year: z.number()
    .min(1900, "Year must be 1900 or later")
    .max(currentYear + 1, `Year cannot be more than ${currentYear + 1}`),
  registration_number: z.string().min(3, "Registration number is required"),
  category_id: z.string().min(1, "Category is required"),
  vehicle_type_id: z.string().min(1, "Vehicle type is required"),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid']).optional(),
  transmission: z.enum(['manual', 'automatic']).optional(),
  seats: z.number().min(1).max(20).optional(),
  luggage_capacity: z.number().min(0).max(20).optional(),
  is_available: z.boolean().default(true),
})

interface VehicleFormProps {
  businessId: string
  initialData?: Vehicle
}

export function VehicleForm({ businessId, initialData }: VehicleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [primaryImage, setPrimaryImage] = useState<string>(initialData?.primary_image_url || "")
  const [galleryImages, setGalleryImages] = useState<string[]>(initialData?.gallery_images || [])
  const [categories, setCategories] = useState<VehicleCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(true)

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: initialData?.make || "",
      model: initialData?.model || "",
      year: initialData?.year || currentYear,
      registration_number: initialData?.registration_number || "",
      category_id: initialData?.category_id || "",
      vehicle_type_id: initialData?.vehicle_type_id || "",
      fuel_type: initialData?.fuel_type as any || 'petrol',
      transmission: initialData?.transmission as any || 'manual',
      seats: initialData?.seats || 5,
      luggage_capacity: initialData?.luggage_capacity || 2,
      is_available: initialData?.is_available ?? true,
    },
  })

  const watchedCategoryId = form.watch('category_id')

  useEffect(() => {
    async function loadData() {
      try {
        // Load categories
        const categoriesResult = await getVehicleCategories()
        if (categoriesResult.data) {
          setCategories(categoriesResult.data)
        }

        // If editing and has a category, load vehicle types for that category
        if (initialData?.category_id) {
          setLoadingVehicleTypes(true)
          try {
            const types = await getVehicleTypesByCategory(initialData.category_id)
            setVehicleTypes(types)
          } catch (error) {
            console.error("Failed to load initial vehicle types:", error)
          } finally {
            setLoadingVehicleTypes(false)
          }
        }
      } catch (error) {
        toast.error("Failed to load data")
      } finally {
        setLoadingCategories(false)
      }
    }
    loadData()
  }, [initialData?.category_id])

  // Load vehicle types when category changes
  useEffect(() => {
    async function loadVehicleTypes() {
      const categoryId = watchedCategoryId
      if (!categoryId) {
        setVehicleTypes([])
        setLoadingVehicleTypes(false)
        return
      }

      setLoadingVehicleTypes(true)
      try {
        const types = await getVehicleTypesByCategory(categoryId)
        setVehicleTypes(types)
        
        // Clear vehicle type selection if it's not in the new category
        const currentTypeId = form.getValues('vehicle_type_id')
        if (currentTypeId && !types.find(t => t.id === currentTypeId)) {
          form.setValue('vehicle_type_id', '')
        }
      } catch (error) {
        toast.error("Failed to load vehicle types")
      } finally {
        setLoadingVehicleTypes(false)
      }
    }
    
    loadVehicleTypes()
  }, [watchedCategoryId, form])

  const handlePrimaryImageChange = (files: File[]) => {
    if (files.length > 0) {
      setPrimaryImageFile(files[0])
      // Create preview URL
      const url = URL.createObjectURL(files[0])
      setPrimaryImage(url)
    }
  }

  const handlePrimaryImageRemove = () => {
    setPrimaryImageFile(null)
    if (primaryImage.startsWith('blob:')) {
      URL.revokeObjectURL(primaryImage)
    }
    setPrimaryImage("")
  }

  const handleGalleryImagesChange = (files: File[]) => {
    setGalleryFiles(prev => [...prev, ...files])
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file))
    setGalleryImages(prev => [...prev, ...urls])
  }

  const handleGalleryImageRemove = (index: number) => {
    // Remove from files array
    const removedFile = galleryFiles[index]
    if (removedFile) {
      setGalleryFiles(prev => prev.filter((_, i) => i !== index))
    }
    
    // Remove from preview URLs
    const removedUrl = galleryImages[index]
    if (removedUrl && removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl)
    }
    setGalleryImages(prev => prev.filter((_, i) => i !== index))
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  async function onSubmit(values: VehicleFormData) {
    setIsLoading(true)

    try {
      // Convert files to base64
      let primaryImageBase64: string | null = null
      let galleryImagesBase64: string[] = []

      if (primaryImageFile) {
        primaryImageBase64 = await fileToBase64(primaryImageFile)
      }

      if (galleryFiles.length > 0) {
        galleryImagesBase64 = await Promise.all(
          galleryFiles.map(file => fileToBase64(file))
        )
      }

      const formData = {
        ...values,
        primaryImageBase64,
        galleryImagesBase64,
        existingPrimaryImage: initialData?.primary_image_url || null,
        existingGalleryImages: initialData?.gallery_images || []
      }

      const result = initialData
        ? await updateVehicle(initialData.id, businessId, formData)
        : await createVehicle(businessId, formData)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(initialData ? "Vehicle updated" : "Vehicle added to fleet")
        router.push('/vendor/vehicles')
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
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>
              Basic details about the vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={currentYear.toString()}
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>
              Specifications and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingCategories}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select vehicle category"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicle_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!form.watch('category_id') || loadingVehicleTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !form.watch('category_id') 
                            ? "Select a category first" 
                            : loadingVehicleTypes 
                            ? "Loading vehicle types..." 
                            : "Select vehicle type"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} ({type.passenger_capacity} passengers, {type.luggage_capacity} bags)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Vehicle type determines passenger and luggage capacity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transmission" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Seats</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="5"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
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
                        placeholder="2"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of luggage pieces
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>
              Control when this vehicle is available for rent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="is_available"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Available for Rent
                    </FormLabel>
                    <FormDescription>
                      Make this vehicle available for customers to book
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Images</CardTitle>
            <CardDescription>
              Add photos to showcase your vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ImageUpload
              label="Primary Image"
              description="Main photo that will be displayed in search results"
              value={primaryImage}
              onChange={handlePrimaryImageChange}
              onRemove={handlePrimaryImageRemove}
              disabled={isLoading || uploadingImages}
              uploading={uploadingImages}
            />

            <ImageUpload
              label="Gallery Images"
              description="Additional photos to showcase different angles and features"
              value={galleryImages}
              onChange={handleGalleryImagesChange}
              onRemove={handleGalleryImageRemove}
              multiple
              maxFiles={10}
              disabled={isLoading || uploadingImages}
              uploading={uploadingImages}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/vendor/vehicles')}
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
                {initialData ? "Update Vehicle" : "Add Vehicle"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
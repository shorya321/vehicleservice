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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Addon, AddonFormData, createAddon, updateAddon } from "../actions"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  pricing_type: z.enum(['fixed', 'per_unit']),
  max_quantity: z.coerce.number().min(1, "Max quantity must be at least 1").max(20, "Max quantity cannot exceed 20"),
  category: z.string().min(1, "Category is required"),
  display_order: z.coerce.number().optional(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

// Available icons for addons
const ADDON_ICONS = [
  { value: 'Baby', label: 'Baby/Child Seat' },
  { value: 'Briefcase', label: 'Briefcase/Luggage' },
  { value: 'Wifi', label: 'WiFi' },
  { value: 'Coffee', label: 'Coffee/Refreshments' },
  { value: 'Mountain', label: 'Mountain/Ski' },
  { value: 'Target', label: 'Target/Golf' },
  { value: 'PawPrint', label: 'Pet' },
  { value: 'BatteryCharging', label: 'Charging' },
  { value: 'GlassWater', label: 'Water' },
  { value: 'Newspaper', label: 'Newspaper' },
  { value: 'HandHeart', label: 'Meet & Greet' },
  { value: 'FileText', label: 'Document/Sign' },
  { value: 'Zap', label: 'Priority/Fast' },
  { value: 'Clock', label: 'Time/Wait' },
  { value: 'Plane', label: 'Flight' },
  { value: 'Car', label: 'Vehicle' },
  { value: 'HeadphonesIcon', label: 'Support' },
]

// Categories
const ADDON_CATEGORIES = [
  { value: 'Child Safety', label: 'Child Safety' },
  { value: 'Luggage', label: 'Luggage & Cargo' },
  { value: 'Comfort', label: 'Comfort & Convenience' },
]

interface AddonFormProps {
  addon?: Addon
}

// Dynamic icon component
function IconPreview({ iconName }: { iconName: string }) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
  if (!IconComponent) return null
  return <IconComponent className="h-5 w-5" />
}

export function AddonForm({ addon }: AddonFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: addon?.name || "",
      description: addon?.description || "",
      icon: addon?.icon || "Baby",
      price: addon?.price || 0,
      pricing_type: addon?.pricing_type || "fixed",
      max_quantity: addon?.max_quantity || 1,
      category: addon?.category || "Comfort",
      display_order: addon?.display_order || 0,
      is_active: addon?.is_active ?? true,
    },
  })

  const watchPricingType = form.watch('pricing_type')
  const watchIcon = form.watch('icon')
  const watchPrice = Number(form.watch('price')) || 0
  const watchMaxQuantity = Number(form.watch('max_quantity')) || 1

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      if (addon) {
        await updateAddon(addon.id, data)
        toast.success("Addon updated successfully")
      } else {
        await createAddon(data)
        toast.success("Addon created successfully")
      }
      router.push("/admin/addons")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
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
                  <Input placeholder="e.g., Child Seat, WiFi, Extra Luggage" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ADDON_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Group this addon under a category
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
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <IconPreview iconName={watchIcon} />
                          <span>{ADDON_ICONS.find(i => i.value === watchIcon)?.label || watchIcon}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ADDON_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <IconPreview iconName={icon.value} />
                          <span>{icon.label}</span>
                        </div>
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
            name="display_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of this addon"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pricing Section */}
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="font-medium">Pricing Configuration</h3>

          <FormField
            control={form.control}
            name="pricing_type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Pricing Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex gap-6"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="fixed" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Fixed Price
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="per_unit" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Per Unit
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  {watchPricingType === 'fixed'
                    ? 'Customer pays a single flat fee for this addon'
                    : 'Customer can select quantity (e.g., 2 child seats)'
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {watchPricingType === 'fixed' ? 'Total price' : 'Price per unit'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchPricingType === 'per_unit' && (
              <FormField
                control={form.control}
                name="max_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        placeholder="e.g., 4"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum units customer can select
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Price Preview */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-2">Price Preview</p>
            <div className="flex gap-8">
              {watchPricingType === 'fixed' ? (
                <div>
                  <span className="text-xs text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium">
                    {watchPrice === 0 ? 'Free' : `$${watchPrice.toFixed(2)}`}
                  </span>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-xs text-muted-foreground">1 unit:</span>
                    <span className="ml-2 font-medium">${watchPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{watchMaxQuantity} units (max):</span>
                    <span className="ml-2 font-medium">${(watchPrice * watchMaxQuantity).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Make this addon available for selection in bookings
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
            {addon ? "Update" : "Create"} Addon
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/addons")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

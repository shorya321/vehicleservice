'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Zone, createZone, updateZone } from '../actions'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).regex(
    /^[a-z0-9-]+$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  ),
  description: z.string().optional(),
  sort_order: z.number().min(0).max(999),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface ZoneFormProps {
  zone?: Zone
}

export function ZoneForm({ zone }: ZoneFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: zone?.name || '',
      slug: zone?.slug || '',
      description: zone?.description || '',
      sort_order: zone?.sort_order || 0,
      is_active: zone?.is_active ?? true,
    },
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('slug', values.slug)
    formData.append('description', values.description || '')
    formData.append('sort_order', values.sort_order.toString())
    formData.append('is_active', values.is_active.toString())

    const result = zone
      ? await updateZone(zone.id, formData)
      : await createZone(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(zone ? 'Zone updated successfully' : 'Zone created successfully')
      router.push('/admin/zones')
      router.refresh()
    }

    setIsSubmitting(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zone Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Zone A, Downtown, Airport Area"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    if (!zone && !form.getValues('slug')) {
                      form.setValue('slug', generateSlug(e.target.value))
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                The display name for this zone
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
                <Input placeholder="e.g., zone-a, downtown, airport-area" {...field} />
              </FormControl>
              <FormDescription>
                URL-friendly identifier (lowercase letters, numbers, and hyphens only)
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
                  placeholder="Optional description of the zone..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Additional information about this zone (optional)
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
                  min="0"
                  max="999"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Display order in lists (lower numbers appear first)
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
                  Enable this zone for pricing calculations
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
            {zone ? 'Update Zone' : 'Create Zone'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/zones')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
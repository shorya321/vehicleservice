'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceCode, updateServiceCode } from '../actions'
import type { ServiceCode } from '../actions'

const SERVICE_TYPES = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'yacht', label: 'Yacht' },
  { value: 'jet', label: 'Jet' },
  { value: 'desert', label: 'Desert' },
]

const formSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(4, 'Code must be 4 characters or less')
    .regex(/^[A-Z]+$/, 'Code must be uppercase letters only'),
  description: z.string().min(1, 'Description is required'),
  service_type: z.string().min(1, 'Service type is required'),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface ServiceCodeFormProps {
  initialData?: ServiceCode
}

export function ServiceCodeForm({ initialData }: ServiceCodeFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: initialData?.code || '',
      description: initialData?.description || '',
      service_type: initialData?.service_type || 'transfer',
      is_active: initialData?.is_active ?? true,
    },
  })

  async function onSubmit(values: FormValues) {
    const result = isEditing
      ? await updateServiceCode(initialData.code, {
          description: values.description,
          service_type: values.service_type,
          is_active: values.is_active,
        })
      : await createServiceCode(values)

    if (result.success) {
      toast.success(isEditing ? 'Service code updated' : 'Service code created')
      router.push('/admin/service-codes')
      router.refresh()
    } else {
      toast.error(result.error || 'Something went wrong')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit' : 'Create'} Service Code</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="TAH"
                      className="font-mono uppercase"
                      maxLength={4}
                      disabled={isEditing}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Unique code used in trip numbers (e.g., TAH for Airport→Hotel)
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
                    <Input
                      {...field}
                      placeholder="Transfer Airport to Hotel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Inactive codes won&apos;t be assigned to new bookings
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

            <div className="flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : isEditing
                    ? 'Update'
                    : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/service-codes')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

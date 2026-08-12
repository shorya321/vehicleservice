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
import { Badge } from '@/components/ui/badge'
import { LocationTypeRecord } from '@/lib/types/location-type'
import { LOCATION_TYPE_ICON_OPTIONS, COLOR_THEME_PRESETS } from '@/lib/constants/location-type-presets'
import { getLocationTypeIcon } from '@/lib/utils/location-type-utils'
import { createLocationType, updateLocationType } from '../actions'

const formSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  name: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  icon_name: z.string().min(1, 'Icon is required'),
  color_theme: z.string().min(1, 'Color theme is required'),
  abbreviation: z.string().length(1, 'Abbreviation must be exactly 1 character').regex(/^[A-Z]$/, 'Must be an uppercase letter'),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface LocationTypeFormProps {
  initialData?: LocationTypeRecord
}

function findThemeNameFromConfig(colorConfig?: LocationTypeRecord['color_config']): string {
  if (!colorConfig) return COLOR_THEME_PRESETS[0].name
  const match = COLOR_THEME_PRESETS.find(
    (p) => p.config.color === colorConfig.color
  )
  return match?.name || COLOR_THEME_PRESETS[0].name
}

export function LocationTypeForm({ initialData }: LocationTypeFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: initialData?.label || '',
      name: initialData?.name || '',
      icon_name: initialData?.icon_name || 'map-pin',
      color_theme: findThemeNameFromConfig(initialData?.color_config),
      abbreviation: initialData?.abbreviation || '',
      sort_order: initialData?.sort_order ?? 0,
      is_active: initialData?.is_active ?? true,
    },
  })

  const watchedIcon = form.watch('icon_name')
  const watchedTheme = form.watch('color_theme')
  const watchedLabel = form.watch('label')

  const selectedTheme = COLOR_THEME_PRESETS.find((p) => p.name === watchedTheme)

  function handleLabelChange(label: string) {
    form.setValue('label', label)
    if (!isEditing) {
      form.setValue('name', label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
    }
  }

  async function onSubmit(values: FormValues) {
    const theme = COLOR_THEME_PRESETS.find((p) => p.name === values.color_theme)
    if (!theme) {
      toast.error('Invalid color theme selected')
      return
    }

    const payload = {
      name: values.name,
      label: values.label,
      icon_name: values.icon_name,
      color_config: theme.config,
      abbreviation: values.abbreviation,
      sort_order: values.sort_order,
      is_active: values.is_active,
    }

    const result = isEditing
      ? await updateLocationType(initialData.id, payload)
      : await createLocationType(payload)

    if (result.success) {
      toast.success(isEditing ? 'Location type updated' : 'Location type created')
      router.push('/admin/location-types')
      router.refresh()
    } else {
      toast.error(result.error || 'Something went wrong')
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit' : 'Create'} Location Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Label</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Airport"
                            onChange={(e) => handleLabelChange(e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>Display name shown to users</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="airport"
                            disabled={isEditing}
                          />
                        </FormControl>
                        <FormDescription>URL-friendly identifier</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="icon_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LOCATION_TYPE_ICON_OPTIONS.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
                                <span className="flex items-center gap-2">
                                  {getLocationTypeIcon(icon.value, 'h-4 w-4')}
                                  {icon.label}
                                </span>
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
                    name="color_theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Theme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COLOR_THEME_PRESETS.map((theme) => (
                              <SelectItem key={theme.name} value={theme.name}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${theme.config.progressBg}`} />
                                  {theme.label}
                                </span>
                              </SelectItem>
                            ))}
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
                    name="abbreviation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abbreviation</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="A"
                            maxLength={1}
                            className="font-mono uppercase w-20"
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription>Single letter for service codes (e.g., A for Airport)</FormDescription>
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
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </FormControl>
                        <FormDescription>Display order (lower = first)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive types won&apos;t appear in location forms or filters
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
                    onClick={() => router.push('/admin/location-types')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${selectedTheme?.config.bg || 'bg-muted'}`}>
                {getLocationTypeIcon(watchedIcon, `h-5 w-5 ${selectedTheme?.config.color || ''}`)}
              </div>
              <div>
                <p className="font-medium">{watchedLabel || 'Location Type'}</p>
                <p className="text-xs text-muted-foreground">How it appears in lists</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Badge preview</p>
              <Badge className={selectedTheme?.config.badgeClass || ''}>
                {watchedLabel || 'Type'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

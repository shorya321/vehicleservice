'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, Palette, Save } from 'lucide-react'
import { toast } from 'sonner'
import { LogoUpload } from './logo-upload'

const brandingSchema = z.object({
  brand_name: z.string().min(2, 'Brand name must be at least 2 characters').max(100).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
})

type BrandingFormValues = z.infer<typeof brandingSchema>

interface BrandingFormProps {
  businessAccountId: string
  currentBranding: {
    brand_name: string | null
    logo_url: string | null
    primary_color: string
    secondary_color: string
    accent_color: string
  }
}

export function BrandingForm({ businessAccountId, currentBranding }: BrandingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(currentBranding.logo_url)

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      brand_name: currentBranding.brand_name || '',
      primary_color: currentBranding.primary_color || '#181818',
      secondary_color: currentBranding.secondary_color || '#C6AA88',
      accent_color: currentBranding.accent_color || '#C6AA88',
    },
  })

  const onSubmit = async (data: BrandingFormValues) => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/business/branding/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update branding settings')
      }

      toast.success('Branding settings updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Branding update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update branding settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpdate = (newLogoUrl: string | null) => {
    setLogoUrl(newLogoUrl)
    router.refresh()
  }

  // Color preset buttons - Professional dark backgrounds with tasteful accents
  const colorPresets = [
    { name: 'Luxury', primary: '#181818', secondary: '#C6AA88', accent: '#C6AA88' },
    { name: 'Executive', primary: '#1e293b', secondary: '#60a5fa', accent: '#60a5fa' },
    { name: 'Forest', primary: '#1e3a2e', secondary: '#86efac', accent: '#86efac' },
    { name: 'Midnight', primary: '#2d1b3d', secondary: '#c084fc', accent: '#c084fc' },
  ]

  const applyPreset = (preset: typeof colorPresets[0]) => {
    form.setValue('primary_color', preset.primary)
    form.setValue('secondary_color', preset.secondary)
    form.setValue('accent_color', preset.accent)
  }

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <LogoUpload
        businessAccountId={businessAccountId}
        currentLogoUrl={logoUrl}
        onLogoUpdate={handleLogoUpdate}
      />

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Customize the color scheme for your white-label platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Brand Name */}
              <FormField
                control={form.control}
                name="brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Brand Name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Override your business name with a custom brand name for public display
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Presets */}
              <div className="space-y-2">
                <Label>Color Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="flex items-center gap-2"
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <div className="flex gap-3 items-center">
                      <FormControl>
                        <Input type="color" className="w-20 h-10 cursor-pointer" {...field} />
                      </FormControl>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#3b82f6"
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Main brand color used for primary buttons and accents
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Secondary Color */}
              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <div className="flex gap-3 items-center">
                      <FormControl>
                        <Input type="color" className="w-20 h-10 cursor-pointer" {...field} />
                      </FormControl>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#1e40af"
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Secondary brand color for hover states and highlights
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Accent Color */}
              <FormField
                control={form.control}
                name="accent_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accent Color</FormLabel>
                    <div className="flex gap-3 items-center">
                      <FormControl>
                        <Input type="color" className="w-20 h-10 cursor-pointer" {...field} />
                      </FormControl>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#8b5cf6"
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Accent color for special elements and call-to-actions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Preview */}
              <div className="rounded-lg border p-4 space-y-3">
                <Label>Color Preview</Label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-20 rounded-md flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: form.watch('primary_color') }}
                    >
                      Primary
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-20 rounded-md flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: form.watch('secondary_color') }}
                    >
                      Secondary
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-20 rounded-md flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: form.watch('accent_color') }}
                    >
                      Accent
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Branding Settings
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

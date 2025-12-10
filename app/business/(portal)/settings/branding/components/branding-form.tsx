'use client'

/**
 * Branding Form Component
 * Form for customizing brand colors and logo
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

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
import { Loader2, Palette, Save, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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

// Helper function to determine text color based on background luminance
function getContrastTextColor(hexColor: string): string {
  // Default to dark text if invalid color
  if (!hexColor || !hexColor.match(/^#[0-9A-Fa-f]{6}$/)) {
    return 'text-zinc-900';
  }
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'text-zinc-900' : 'text-white';
}

export function BrandingForm({ businessAccountId, currentBranding }: BrandingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(currentBranding.logo_url)

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      brand_name: currentBranding.brand_name || '',
      primary_color: currentBranding.primary_color || '#0F0F12',
      secondary_color: currentBranding.secondary_color || '#6366F1',
      accent_color: currentBranding.accent_color || '#818CF8',
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

  // Color preset buttons - Obsidian Luxury presets
  const colorPresets = [
    { name: 'Obsidian Gold', primary: '#050505', secondary: '#C6AA88', accent: '#A68B5B', icon: '✨' },
    { name: 'Indigo', primary: '#0F0F12', secondary: '#6366F1', accent: '#818CF8', icon: '💜' },
    { name: 'Executive', primary: '#1e293b', secondary: '#60a5fa', accent: '#60a5fa', icon: '💎' },
    { name: 'Forest', primary: '#1e3a2e', secondary: '#86efac', accent: '#86efac', icon: '🌲' },
    { name: 'Midnight', primary: '#2d1b3d', secondary: '#c084fc', accent: '#c084fc', icon: '🌙' },
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
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Palette className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Brand Colors
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Customize the color scheme for your white-label platform
              </CardDescription>
            </div>
          </div>
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
                    <FormLabel className="text-muted-foreground">Brand Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your Brand Name"
                        {...field}
                        className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500/20"
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground">
                      Override your business name with a custom brand name for public display
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Presets */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <Label className="text-muted-foreground">Color Presets</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="flex items-center gap-2 bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:border-violet-500/30 transition-all duration-200"
                    >
                      <div className="flex gap-1">
                        <div
                          className="w-4 h-4 rounded-full border border-border shadow-inner"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
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
                    <FormLabel className="text-muted-foreground">Primary Color</FormLabel>
                    <div className="flex gap-3 items-center">
                      <FormControl>
                        <Input
                          type="color"
                          className="w-20 h-10 cursor-pointer rounded-lg bg-muted border-border hover:border-violet-500/30"
                          {...field}
                        />
                      </FormControl>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#3b82f6"
                          {...field}
                          className="font-mono bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500/20"
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-muted-foreground">
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
                    <FormLabel className="text-muted-foreground">Secondary Color</FormLabel>
                    <div className="flex gap-3 items-center">
                      <FormControl>
                        <Input
                          type="color"
                          className="w-20 h-10 cursor-pointer rounded-lg bg-muted border-border hover:border-violet-500/30"
                          {...field}
                        />
                      </FormControl>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#1e40af"
                          {...field}
                          className="font-mono bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500/20"
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-muted-foreground">
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
                    <FormLabel className="text-muted-foreground">Accent Color</FormLabel>
                    <div className="flex gap-3 items-center">
                      <FormControl>
                        <Input
                          type="color"
                          className="w-20 h-10 cursor-pointer rounded-lg bg-muted border-border hover:border-violet-500/30"
                          {...field}
                        />
                      </FormControl>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="#8b5cf6"
                          {...field}
                          className="font-mono bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500/20"
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-muted-foreground">
                      Accent color for special elements and call-to-actions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Preview */}
              <div className="rounded-xl border border-border bg-muted p-4 space-y-3">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Color Preview
                </Label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div
                      className={cn(
                        "h-20 rounded-xl flex items-center justify-center font-medium text-sm border border-border shadow-lg transition-all duration-300",
                        getContrastTextColor(form.watch('primary_color'))
                      )}
                      style={{ backgroundColor: form.watch('primary_color') }}
                    >
                      Primary
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div
                      className={cn(
                        "h-20 rounded-xl flex items-center justify-center font-medium text-sm border border-border shadow-lg transition-all duration-300",
                        getContrastTextColor(form.watch('secondary_color'))
                      )}
                      style={{ backgroundColor: form.watch('secondary_color') }}
                    >
                      Secondary
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div
                      className={cn(
                        "h-20 rounded-xl flex items-center justify-center font-medium text-sm border border-border shadow-lg transition-all duration-300",
                        getContrastTextColor(form.watch('accent_color'))
                      )}
                      style={{ backgroundColor: form.watch('accent_color') }}
                    >
                      Accent
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
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

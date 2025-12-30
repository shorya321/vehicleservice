'use client'

/**
 * Branding Form Component
 * Full theme customization with dark/light mode support and live preview
 * Uses ThemeConfig JSONB structure for storage
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, Palette, Save, Sparkles, Moon, Sun, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { LogoUpload } from './logo-upload'
import { LivePreview } from './live-preview'
import {
  FULL_COLOR_PRESETS,
  DEFAULT_THEME_CONFIG,
  type ColorPreset,
  type ThemeConfig,
} from '@/lib/business/branding-utils'

// Form schema with flat structure for easier form handling
const brandingFormSchema = z.object({
  // Brand identity
  brand_name: z.string().min(2, 'Brand name must be at least 2 characters').max(100).optional().or(z.literal('')),
  // Accent colors
  accent_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  accent_secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  accent_tertiary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  // Dark mode colors
  dark_background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  dark_surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  dark_card: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  dark_sidebar: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  dark_text_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  dark_text_secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  dark_border: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  // Light mode colors
  light_background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  light_surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  light_card: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  light_sidebar: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  light_text_primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  light_text_secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  light_border: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
})

type BrandingFormValues = z.infer<typeof brandingFormSchema>

interface CurrentBranding {
  brand_name: string | null
  logo_url: string | null
  theme_config: ThemeConfig
}

interface BrandingFormProps {
  businessAccountId: string
  currentBranding: CurrentBranding
}

// Color input component for cleaner code
function ColorInput({
  label,
  value,
  onChange,
  description,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-foreground">{label}</Label>
      <div className="flex gap-2 items-center">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 cursor-pointer rounded-lg bg-muted border-border hover:border-primary/30 p-1"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm bg-muted border-border text-foreground focus:border-primary focus:ring-primary/20"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

export function BrandingForm({ businessAccountId, currentBranding }: BrandingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(currentBranding.logo_url)
  const [activeTab, setActiveTab] = useState<'dark' | 'light'>('dark')

  const themeConfig = currentBranding.theme_config

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      brand_name: currentBranding.brand_name || '',
      // Accent colors from theme_config
      accent_primary: themeConfig.accent.primary,
      accent_secondary: themeConfig.accent.secondary,
      accent_tertiary: themeConfig.accent.tertiary,
      // Dark mode from theme_config
      dark_background: themeConfig.dark.background,
      dark_surface: themeConfig.dark.surface,
      dark_card: themeConfig.dark.card,
      dark_sidebar: themeConfig.dark.sidebar,
      dark_text_primary: themeConfig.dark.text_primary,
      dark_text_secondary: themeConfig.dark.text_secondary,
      dark_border: themeConfig.dark.border,
      // Light mode from theme_config
      light_background: themeConfig.light.background,
      light_surface: themeConfig.light.surface,
      light_card: themeConfig.light.card,
      light_sidebar: themeConfig.light.sidebar,
      light_text_primary: themeConfig.light.text_primary,
      light_text_secondary: themeConfig.light.text_secondary,
      light_border: themeConfig.light.border,
    },
  })

  const watchedValues = form.watch()

  // Memoized preview colors
  const previewColors = useMemo(() => ({
    dark: {
      primary: watchedValues.accent_primary,
      secondary: watchedValues.accent_secondary,
      accent: watchedValues.accent_tertiary,
      background: watchedValues.dark_background,
      surface: watchedValues.dark_surface,
      card: watchedValues.dark_card,
      sidebar: watchedValues.dark_sidebar,
      textPrimary: watchedValues.dark_text_primary,
      textSecondary: watchedValues.dark_text_secondary,
      border: watchedValues.dark_border,
    },
    light: {
      primary: watchedValues.accent_primary,
      secondary: watchedValues.accent_secondary,
      accent: watchedValues.accent_tertiary,
      background: watchedValues.light_background,
      surface: watchedValues.light_surface,
      card: watchedValues.light_card,
      sidebar: watchedValues.light_sidebar,
      textPrimary: watchedValues.light_text_primary,
      textSecondary: watchedValues.light_text_secondary,
      border: watchedValues.light_border,
    },
  }), [watchedValues])

  const onSubmit = async (data: BrandingFormValues) => {
    try {
      setIsLoading(true)

      // Build ThemeConfig structure for API
      const themeConfigPayload: ThemeConfig = {
        accent: {
          primary: data.accent_primary,
          secondary: data.accent_secondary,
          tertiary: data.accent_tertiary,
        },
        dark: {
          background: data.dark_background,
          surface: data.dark_surface,
          card: data.dark_card,
          sidebar: data.dark_sidebar,
          text_primary: data.dark_text_primary,
          text_secondary: data.dark_text_secondary,
          border: data.dark_border,
        },
        light: {
          background: data.light_background,
          surface: data.light_surface,
          card: data.light_card,
          sidebar: data.light_sidebar,
          text_primary: data.light_text_primary,
          text_secondary: data.light_text_secondary,
          border: data.light_border,
        },
      }

      const response = await fetch('/api/business/branding/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: data.brand_name || undefined,
          theme_config: themeConfigPayload,
        }),
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

  const applyPreset = (preset: ColorPreset) => {
    // Accent colors
    form.setValue('accent_primary', preset.accent.primary)
    form.setValue('accent_secondary', preset.accent.secondary)
    form.setValue('accent_tertiary', preset.accent.tertiary)
    // Dark mode
    form.setValue('dark_background', preset.dark.background)
    form.setValue('dark_surface', preset.dark.surface)
    form.setValue('dark_card', preset.dark.card)
    form.setValue('dark_sidebar', preset.dark.sidebar)
    form.setValue('dark_text_primary', preset.dark.text_primary)
    form.setValue('dark_text_secondary', preset.dark.text_secondary)
    form.setValue('dark_border', preset.dark.border)
    // Light mode
    form.setValue('light_background', preset.light.background)
    form.setValue('light_surface', preset.light.surface)
    form.setValue('light_card', preset.light.card)
    form.setValue('light_sidebar', preset.light.sidebar)
    form.setValue('light_text_primary', preset.light.text_primary)
    form.setValue('light_text_secondary', preset.light.text_secondary)
    form.setValue('light_border', preset.light.border)
  }

  const resetToDefaults = () => {
    const defaultPreset = FULL_COLOR_PRESETS[0] // Gold Luxury
    applyPreset(defaultPreset)
    toast.info('Colors reset to default Gold Luxury theme')
  }

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <LogoUpload
        businessAccountId={businessAccountId}
        currentLogoUrl={logoUrl}
        onLogoUpdate={handleLogoUpdate}
      />

      {/* Brand Colors & Theme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Color Settings */}
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Theme Colors
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Customize colors for dark and light modes
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
                      <FormLabel className="text-foreground">Brand Name (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your Brand Name"
                          {...field}
                          className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground text-xs">
                        Override your business name for public display
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <Label className="text-foreground text-sm">Theme Presets</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetToDefaults}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {FULL_COLOR_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="h-auto py-2 px-3 justify-start bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:border-primary/30 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex -space-x-1">
                            <div
                              className="w-4 h-4 rounded-full border border-border shadow-sm"
                              style={{ backgroundColor: preset.dark.background }}
                            />
                            <div
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: preset.accent.primary }}
                            />
                          </div>
                          <span className="text-xs truncate">{preset.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Accent Colors */}
                <div className="space-y-4 pt-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Accent Colors
                  </Label>
                  <div className="grid grid-cols-1 gap-4">
                    <ColorInput
                      label="Primary"
                      value={watchedValues.accent_primary}
                      onChange={(v) => form.setValue('accent_primary', v)}
                      description="Main brand color for buttons and accents"
                    />
                    <ColorInput
                      label="Secondary"
                      value={watchedValues.accent_secondary}
                      onChange={(v) => form.setValue('accent_secondary', v)}
                    />
                    <ColorInput
                      label="Tertiary"
                      value={watchedValues.accent_tertiary}
                      onChange={(v) => form.setValue('accent_tertiary', v)}
                    />
                  </div>
                </div>

                {/* Mode Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dark' | 'light')} className="pt-2">
                  <TabsList className="grid w-full grid-cols-2 bg-muted">
                    <TabsTrigger value="dark" className="data-[state=active]:bg-background">
                      <Moon className="w-3.5 h-3.5 mr-1.5" />
                      Dark Mode
                    </TabsTrigger>
                    <TabsTrigger value="light" className="data-[state=active]:bg-background">
                      <Sun className="w-3.5 h-3.5 mr-1.5" />
                      Light Mode
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dark" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ColorInput
                        label="Background"
                        value={watchedValues.dark_background}
                        onChange={(v) => form.setValue('dark_background', v)}
                      />
                      <ColorInput
                        label="Surface"
                        value={watchedValues.dark_surface}
                        onChange={(v) => form.setValue('dark_surface', v)}
                      />
                      <ColorInput
                        label="Card"
                        value={watchedValues.dark_card}
                        onChange={(v) => form.setValue('dark_card', v)}
                        description="Card background color"
                      />
                      <ColorInput
                        label="Sidebar"
                        value={watchedValues.dark_sidebar}
                        onChange={(v) => form.setValue('dark_sidebar', v)}
                      />
                      <ColorInput
                        label="Border"
                        value={watchedValues.dark_border}
                        onChange={(v) => form.setValue('dark_border', v)}
                      />
                      <ColorInput
                        label="Text Primary"
                        value={watchedValues.dark_text_primary}
                        onChange={(v) => form.setValue('dark_text_primary', v)}
                      />
                      <ColorInput
                        label="Text Secondary"
                        value={watchedValues.dark_text_secondary}
                        onChange={(v) => form.setValue('dark_text_secondary', v)}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="light" className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ColorInput
                        label="Background"
                        value={watchedValues.light_background}
                        onChange={(v) => form.setValue('light_background', v)}
                      />
                      <ColorInput
                        label="Surface"
                        value={watchedValues.light_surface}
                        onChange={(v) => form.setValue('light_surface', v)}
                      />
                      <ColorInput
                        label="Card"
                        value={watchedValues.light_card}
                        onChange={(v) => form.setValue('light_card', v)}
                        description="Card background color"
                      />
                      <ColorInput
                        label="Sidebar"
                        value={watchedValues.light_sidebar}
                        onChange={(v) => form.setValue('light_sidebar', v)}
                      />
                      <ColorInput
                        label="Border"
                        value={watchedValues.light_border}
                        onChange={(v) => form.setValue('light_border', v)}
                      />
                      <ColorInput
                        label="Text Primary"
                        value={watchedValues.light_text_primary}
                        onChange={(v) => form.setValue('light_text_primary', v)}
                      />
                      <ColorInput
                        label="Text Secondary"
                        value={watchedValues.light_text_secondary}
                        onChange={(v) => form.setValue('light_text_secondary', v)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

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

        {/* Right Column: Live Preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <LivePreview
            darkColors={previewColors.dark}
            lightColors={previewColors.light}
            brandName={watchedValues.brand_name || 'Brand'}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}

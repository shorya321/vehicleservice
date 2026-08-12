'use client'

/**
 * Appearance Settings Form Component
 * Full theme customization with dark/light mode support and live preview
 * Same color picker UI as business branding (no presets)
 *
 * SCOPE: Admin module ONLY
 * Changes affect both admin and vendor portals
 */

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form } from '@/components/ui/form'
import {
  Loader2,
  Palette,
  Save,
  Moon,
  Sun,
  RotateCcw,
  Monitor,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminLivePreview } from './live-preview'
import type { AdminThemeConfig } from '@/lib/admin'
import { DEFAULT_ADMIN_THEME } from '@/lib/admin'

// Form schema
const appearanceFormSchema = z.object({
  // Mode
  mode: z.enum(['dark', 'light']),
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

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

interface AppearanceSettingsFormProps {
  currentTheme: AdminThemeConfig
}

// Color input component - same as business branding
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

export function AppearanceSettingsForm({ currentTheme }: AppearanceSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'dark' | 'light'>('dark')

  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      mode: currentTheme.mode,
      // Accent colors
      accent_primary: currentTheme.accent.primary,
      accent_secondary: currentTheme.accent.secondary,
      accent_tertiary: currentTheme.accent.tertiary,
      // Dark mode
      dark_background: currentTheme.dark.background,
      dark_surface: currentTheme.dark.surface,
      dark_card: currentTheme.dark.card,
      dark_sidebar: currentTheme.dark.sidebar,
      dark_text_primary: currentTheme.dark.text_primary,
      dark_text_secondary: currentTheme.dark.text_secondary,
      dark_border: currentTheme.dark.border,
      // Light mode
      light_background: currentTheme.light.background,
      light_surface: currentTheme.light.surface,
      light_card: currentTheme.light.card,
      light_sidebar: currentTheme.light.sidebar,
      light_text_primary: currentTheme.light.text_primary,
      light_text_secondary: currentTheme.light.text_secondary,
      light_border: currentTheme.light.border,
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

  const onSubmit = async (data: AppearanceFormValues) => {
    startTransition(async () => {
      try {
        // Build theme config for API
        const themeConfig: AdminThemeConfig = {
          mode: data.mode,
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
            muted: data.dark_surface, // Use surface as muted
            text_primary: data.dark_text_primary,
            text_secondary: data.dark_text_secondary,
            border: data.dark_border,
          },
          light: {
            background: data.light_background,
            surface: data.light_surface,
            card: data.light_card,
            sidebar: data.light_sidebar,
            muted: data.light_surface, // Use surface as muted
            text_primary: data.light_text_primary,
            text_secondary: data.light_text_secondary,
            border: data.light_border,
          },
        }

        const response = await fetch('/api/admin/appearance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(themeConfig),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update appearance settings')
        }

        toast.success('Appearance settings updated successfully')
        router.refresh()
      } catch (error) {
        console.error('Appearance update error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update appearance settings')
      }
    })
  }

  const resetToDefaults = () => {
    const defaults = DEFAULT_ADMIN_THEME
    form.setValue('mode', defaults.mode)
    form.setValue('accent_primary', defaults.accent.primary)
    form.setValue('accent_secondary', defaults.accent.secondary)
    form.setValue('accent_tertiary', defaults.accent.tertiary)
    form.setValue('dark_background', defaults.dark.background)
    form.setValue('dark_surface', defaults.dark.surface)
    form.setValue('dark_card', defaults.dark.card)
    form.setValue('dark_sidebar', defaults.dark.sidebar)
    form.setValue('dark_text_primary', defaults.dark.text_primary)
    form.setValue('dark_text_secondary', defaults.dark.text_secondary)
    form.setValue('dark_border', defaults.dark.border)
    form.setValue('light_background', defaults.light.background)
    form.setValue('light_surface', defaults.light.surface)
    form.setValue('light_card', defaults.light.card)
    form.setValue('light_sidebar', defaults.light.sidebar)
    form.setValue('light_text_primary', defaults.light.text_primary)
    form.setValue('light_text_secondary', defaults.light.text_secondary)
    form.setValue('light_border', defaults.light.border)
    toast.info('Colors reset to defaults')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Settings */}
      <Card className="bg-card border border-border rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Theme Settings
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Customize colors for admin and vendor portals
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Mode Selector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    <Label className="text-foreground text-sm font-medium">Display Mode</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetToDefaults}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset All
                  </Button>
                </div>

                <RadioGroup
                  value={watchedValues.mode}
                  onValueChange={(value: 'dark' | 'light') => form.setValue('mode', value)}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem
                      value="dark"
                      id="mode-dark"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="mode-dark"
                      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-muted/50 p-4 cursor-pointer hover:bg-muted/80 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                    >
                      <Moon className="h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm font-medium">Dark Mode</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="light"
                      id="mode-light"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="mode-light"
                      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-muted bg-muted/50 p-4 cursor-pointer hover:bg-muted/80 hover:border-primary/30 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                    >
                      <Sun className="h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm font-medium">Light Mode</span>
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  This sets the default mode for all admin and vendor users
                </p>
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
                    description="Used for data visualization and secondary elements"
                  />
                  <ColorInput
                    label="Tertiary"
                    value={watchedValues.accent_tertiary}
                    onChange={(v) => form.setValue('accent_tertiary', v)}
                    description="Used for status badges and highlights"
                  />
                </div>
              </div>

              {/* Mode-specific Colors Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dark' | 'light')} className="pt-2">
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="dark" className="data-[state=active]:bg-background">
                    <Moon className="w-3.5 h-3.5 mr-1.5" />
                    Dark Colors
                  </TabsTrigger>
                  <TabsTrigger value="light" className="data-[state=active]:bg-background">
                    <Sun className="w-3.5 h-3.5 mr-1.5" />
                    Light Colors
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
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Appearance Settings
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Right Column: Live Preview */}
      <div className="lg:sticky lg:top-6 h-fit">
        <AdminLivePreview
          darkColors={previewColors.dark}
          lightColors={previewColors.light}
          activeMode={watchedValues.mode}
          className="h-full"
        />
      </div>
    </div>
  )
}

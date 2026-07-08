'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
  Save,
  Mail,
  Phone,
  Share2,
  Image as ImageIcon,
  Type,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { updateSiteSettings, uploadSiteLogo, removeSiteLogo } from '../actions'
import type { SiteSettingsConfig } from '@/lib/site-settings/types'
import { siteSettingsSchema, type SiteSettingsFormValues } from '@/lib/site-settings/schema'

interface GeneralSettingsFormProps {
  currentSettings: SiteSettingsConfig
}

export function GeneralSettingsForm({ currentSettings }: GeneralSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      brand_name: currentSettings.brand_name,
      header_logo_url: currentSettings.header_logo_url,
      footer_logo_url: currentSettings.footer_logo_url,
      copyright_text: currentSettings.copyright_text,
      support_email: currentSettings.support_email,
      info_email: currentSettings.info_email,
      bookings_email: currentSettings.bookings_email,
      support_phone: currentSettings.support_phone,
      secondary_phone: currentSettings.secondary_phone,
      office_address: currentSettings.office_address,
      social_links: currentSettings.social_links,
      maintenance_mode: currentSettings.maintenance_mode,
    },
  })

  async function onSubmit(values: SiteSettingsFormValues) {
    setIsSaving(true)
    try {
      const result = await updateSiteSettings(values)
      if (result.success) {
        toast.success('Site settings updated successfully')
        startTransition(() => {
          router.refresh()
        })
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogoUpload(file: File, type: 'header' | 'footer'): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const result = await uploadSiteLogo(formData)
    if (result.error || !result.url) {
      throw new Error(result.error || 'Upload failed')
    }
    return result.url
  }

  async function handleLogoRemove(url: string): Promise<void> {
    const result = await removeSiteLogo(url)
    if (!result.success) {
      throw new Error(result.error || 'Remove failed')
    }
  }

  const isLoading = isSaving || isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Site Availability Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Site Availability</CardTitle>
                <CardDescription>Control public access to the site</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="maintenance_mode"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <FormLabel className="text-base">Maintenance mode</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      When enabled, anonymous visitors see a maintenance page. Logged-in
                      users (admins, customers, vendors) and business portals are unaffected.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle maintenance mode"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Branding Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Type className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Brand name and copyright text displayed across the site</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="brand_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Infinia Transfers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="copyright_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Copyright Text</FormLabel>
                  <FormControl>
                    <Input placeholder="Infinia Transfers" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Displayed as: &copy; {new Date().getFullYear()} {field.value || 'Your Brand'}
                  </p>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Logos Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Logos</CardTitle>
                <CardDescription>Upload logos for the header and footer. If not set, the brand name text is used.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Header Logo</Label>
                <ImageUpload
                  value={form.watch('header_logo_url')}
                  onChange={(url) => form.setValue('header_logo_url', url, { shouldDirty: true })}
                  onUpload={(file) => handleLogoUpload(file, 'header')}
                  onRemove={handleLogoRemove}
                  maxSize={2}
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                />
                <p className="text-xs text-muted-foreground">Recommended: SVG or PNG with transparent background, max 2MB</p>
              </div>
              <div className="space-y-2">
                <Label>Footer Logo</Label>
                <ImageUpload
                  value={form.watch('footer_logo_url')}
                  onChange={(url) => form.setValue('footer_logo_url', url, { shouldDirty: true })}
                  onUpload={(file) => handleLogoUpload(file, 'footer')}
                  onRemove={handleLogoRemove}
                  maxSize={2}
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                />
                <p className="text-xs text-muted-foreground">Recommended: SVG or PNG with transparent background, max 2MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Email addresses, phone numbers, and office address shown on the site</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="support_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="support@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="info_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Info Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookings_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bookings Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="bookings@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="office_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Business Bay, Dubai, UAE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="support_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="+971 50 123 4567" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondary_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="+971 4 123 4567" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Social Media</CardTitle>
                <CardDescription>Social media profile URLs. Leave empty to hide the icon.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="social_links.instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/yourbrand" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_links.facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/yourbrand" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_links.twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter / X</FormLabel>
                    <FormControl>
                      <Input placeholder="https://twitter.com/yourbrand" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_links.linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/company/yourbrand" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_links.youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube</FormLabel>
                    <FormControl>
                      <Input placeholder="https://youtube.com/@yourbrand" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !form.formState.isDirty} className="min-w-[140px]">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

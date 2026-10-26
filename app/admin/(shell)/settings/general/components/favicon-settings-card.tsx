'use client'

import type { UseFormReturn } from 'react-hook-form'
import { AppWindow } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import type { SiteSettingsFormValues } from '@/lib/site-settings/schema'
import { BUILT_IN_FAVICON } from '@/lib/site-settings/logo'

interface FaviconSettingsCardProps {
  form: UseFormReturn<SiteSettingsFormValues>
  onUpload: (file: File) => Promise<string>
  onRemove: (url: string) => Promise<void>
}

function TabPreview({ src, title, dark }: { src: string; title: string; dark: boolean }): React.JSX.Element {
  return (
    <div className={`flex-1 rounded-md border p-2 ${dark ? 'bg-[#202124]' : 'bg-[#dee1e6]'}`}>
      <div
        className={`flex max-w-[220px] items-center gap-2 rounded-t-md px-3 py-2 text-xs ${dark ? 'bg-[#35363a] text-white' : 'bg-white text-neutral-800'}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary upload at tab size */}
        <img src={src} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
        <span className="truncate">{title}</span>
      </div>
      <span className="sr-only">{dark ? 'Dark browser tab preview' : 'Light browser tab preview'}</span>
    </div>
  )
}

export function FaviconSettingsCard({ form, onUpload, onRemove }: FaviconSettingsCardProps): React.JSX.Element {
  const faviconUrl = form.watch('favicon_url')
  const brandName = form.watch('brand_name')
  const src = faviconUrl ?? BUILT_IN_FAVICON.icon192

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AppWindow className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>Favicon</CardTitle>
            <CardDescription>
              The icon in the browser tab and on phone home screens. With none, the built-in Infinia icon is shown.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="space-y-2">
          <Label>Icon</Label>
          <ImageUpload
            value={faviconUrl}
            onChange={(url) => form.setValue('favicon_url', url, { shouldDirty: true })}
            onUpload={onUpload}
            onRemove={onRemove}
            maxSize={2}
            accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
          />
          <p className="max-w-[220px] text-xs text-muted-foreground">
            Square PNG, at least 512 x 512, transparent background. SVG or ICO also work. Max 2MB.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Preview{faviconUrl ? '' : ' (built-in icon)'}
          </p>
          <div className="flex flex-col gap-3">
            <TabPreview src={src} title={brandName} dark={false} />
            <TabPreview src={src} title={brandName} dark />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

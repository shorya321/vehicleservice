'use client'

import type { UseFormReturn } from 'react-hook-form'
import { ImageIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import type { SiteSettingsFormValues } from '@/lib/site-settings/schema'
import { resolveSiteLogo, type LogoSlot } from '@/lib/site-settings/logo'

export type LogoUploadType = 'header' | 'header_dark' | 'footer' | 'footer_dark' | 'favicon'

type LogoField = 'header_logo_url' | 'header_logo_dark_url' | 'footer_logo_url' | 'footer_logo_dark_url'

interface LogosSettingsCardProps {
  form: UseFormReturn<SiteSettingsFormValues>
  onUpload: (file: File, type: LogoUploadType) => Promise<string>
  onRemove: (url: string) => Promise<void>
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml'

const SLOTS: { slot: LogoSlot; title: string; fields: { name: LogoField; type: LogoUploadType; label: string; help: string }[] }[] = [
  {
    slot: 'header',
    title: 'Header',
    fields: [
      { name: 'header_logo_url', type: 'header', label: 'Light mode', help: 'Dark lettering, for a light background.' },
      { name: 'header_logo_dark_url', type: 'header_dark', label: 'Dark mode', help: 'Light lettering, for a dark background.' },
    ],
  },
  {
    slot: 'footer',
    title: 'Footer',
    fields: [
      { name: 'footer_logo_url', type: 'footer', label: 'Light mode', help: 'Dark lettering, for a light background.' },
      { name: 'footer_logo_dark_url', type: 'footer_dark', label: 'Dark mode', help: 'Light lettering, for a dark background.' },
    ],
  },
]

function LogoPreview({ src, dark }: { src: string; dark: boolean }): React.JSX.Element {
  return (
    <div
      className={`flex h-20 flex-1 items-center justify-center rounded-md border px-4 ${dark ? 'bg-[#0e0e10]' : 'bg-[#f5f1ea]'}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary upload, sized by CSS */}
      <img src={src} alt="" className="max-h-14 max-w-full object-contain" />
      <span className="sr-only">{dark ? 'Dark mode preview' : 'Light mode preview'}</span>
    </div>
  )
}

export function LogosSettingsCard({ form, onUpload, onRemove }: LogosSettingsCardProps): React.JSX.Element {
  const values = form.watch()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>Logos</CardTitle>
            <CardDescription>
              Upload a version for each theme. One upload is used in both themes; with none, the built-in Infinia logo is shown.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {SLOTS.map(({ slot, title, fields }) => {
          // Same rule the site uses, so the preview is what visitors will see.
          const resolved = resolveSiteLogo(values, slot)
          return (
            <section key={slot} className="space-y-4">
              <h3 className="text-sm font-semibold">{title} logo</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.label}</Label>
                    <ImageUpload
                      value={values[field.name]}
                      onChange={(url) => form.setValue(field.name, url, { shouldDirty: true })}
                      onUpload={(file) => onUpload(file, field.type)}
                      onRemove={onRemove}
                      maxSize={2}
                      accept={ACCEPT}
                    />
                    <p className="text-xs text-muted-foreground">{field.help} SVG or transparent PNG, max 2MB.</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Preview{resolved.custom ? '' : ' (built-in logo)'}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <LogoPreview src={resolved.light} dark={false} />
                  <LogoPreview src={resolved.dark} dark />
                </div>
              </div>
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}

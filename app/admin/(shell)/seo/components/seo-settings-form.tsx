'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { TextField } from '@/components/admin/cms/text-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { SnippetPreview } from '@/components/admin/seo/snippet-preview'
import { META_DESCRIPTION_LIMIT, META_TITLE_LIMIT, seoSettingsSchema, type SeoSettings } from '@/lib/seo/types'
import { updateSeoSettings } from '../actions'

interface SeoSettingsFormProps {
  initialValues: SeoSettings
  brandName: string
  siteUrl: string
}

export function SeoSettingsForm({ initialValues, brandName, siteUrl }: SeoSettingsFormProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const form = useForm<SeoSettings>({ resolver: zodResolver(seoSettingsSchema), defaultValues: initialValues })
  const { control, watch } = form
  const values = watch()

  async function onSubmit(next: SeoSettings): Promise<void> {
    setSaving(true)
    try {
      const result = await updateSeoSettings(next)
      if (!result.success) {
        toast.error(result.error ?? 'Could not save SEO settings')
        return
      }
      toast.success('SEO settings saved')
      form.reset(next)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Could not save SEO settings. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>Used by the home page, and by any page whose own SEO fields are empty.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-5">
              <TextField
                control={control}
                name="default_title"
                label="Home page title"
                max={80}
                recommended={META_TITLE_LIMIT}
                description="The home page's full title, used exactly as typed."
              />
              <TextField
                control={control}
                name="title_suffix"
                label="Title suffix for other pages"
                max={40}
                placeholder={` | ${brandName}`}
                description="Added once to the end of every other page's title. Empty uses the placeholder."
              />
              <TextField
                control={control}
                name="default_description"
                label="Default meta description"
                max={META_DESCRIPTION_LIMIT * 2}
                recommended={META_DESCRIPTION_LIMIT}
                rows={3}
              />
            </div>
            <SnippetPreview title={values.default_title} description={values.default_description} url={siteUrl} noindex={false} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>The share image is the fallback for any page without its own.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <ImageField control={control} name="default_og_image_url" label="Default share image" description="1200 x 630 works best." />
            <ImageField
              control={control}
              name="organization_logo_url"
              label="Logo for Google"
              description="Square, at least 112 x 112. Empty uses the header logo."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search console verification</CardTitle>
            <CardDescription>Paste only the content value of the verification meta tag.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <TextField control={control} name="google_verification" label="Google Search Console" max={120} />
            <TextField control={control} name="bing_verification" label="Bing Webmaster Tools" max={120} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save SEO settings
          </Button>
        </div>
      </form>
    </Form>
  )
}

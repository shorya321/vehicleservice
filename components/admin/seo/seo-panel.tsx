'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { TextField } from '@/components/admin/cms/text-field'
import { SwitchField } from '@/components/admin/cms/switch-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { updateSeoMeta } from '@/app/admin/(shell)/seo/actions'
import {
  META_DESCRIPTION_LIMIT,
  META_TITLE_LIMIT,
  seoMetaSchema,
  type SeoEntityType,
  type SeoMetaValues,
} from '@/lib/seo/types'
import { SnippetPreview } from './snippet-preview'
import { FieldGroup } from './field-group'

interface SeoPanelProps {
  entityType: SeoEntityType
  entityId: string
  initialValues: SeoMetaValues
  /** Absolute URL of the page, for the preview. */
  pageUrl: string
  /** What the page shows when a field is left empty. */
  fallbackTitle: string
  fallbackDescription: string
}

/**
 * SEO overrides for one public page, blog post, route, zone or location.
 * Every field is optional: empty means the page's own fallback is used.
 */
export function SeoPanel({
  entityType,
  entityId,
  initialValues,
  pageUrl,
  fallbackTitle,
  fallbackDescription,
}: SeoPanelProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const form = useForm<SeoMetaValues>({ resolver: zodResolver(seoMetaSchema), defaultValues: initialValues })
  const { control, watch } = form
  const values = watch()

  async function onSubmit(next: SeoMetaValues): Promise<void> {
    setSaving(true)
    try {
      const result = await updateSeoMeta(entityType, entityId, next)
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <FieldGroup title="Search results" hint="What Google and Bing show for this page.">
            <TextField
              control={control}
              name="meta_title"
              label="Meta title"
              max={120}
              recommended={META_TITLE_LIMIT}
              placeholder={fallbackTitle}
              description="The full title shown in Google and browser tabs, used exactly as typed. Empty uses the placeholder."
            />
            <TextField
              control={control}
              name="meta_description"
              label="Meta description"
              max={320}
              recommended={META_DESCRIPTION_LIMIT}
              rows={3}
              placeholder={fallbackDescription}
            />
            <TextField
              control={control}
              name="meta_keywords"
              label="Meta keywords"
              max={500}
              placeholder="dubai airport transfer, chauffeur, private taxi"
              description="Separate with commas. Google ignores this tag; Bing and some site search tools still read it."
            />
          </FieldGroup>

          <FieldGroup title="Social sharing" hint="The card shown when the link is shared on WhatsApp, Facebook, X or LinkedIn.">
            <TextField
              control={control}
              name="og_title"
              label="Share title"
              max={120}
              recommended={META_TITLE_LIMIT}
              placeholder={values.meta_title || fallbackTitle}
              description="Empty uses the meta title."
            />
            <TextField
              control={control}
              name="og_description"
              label="Share description"
              max={320}
              recommended={META_DESCRIPTION_LIMIT}
              rows={2}
              placeholder={values.meta_description || fallbackDescription}
              description="Empty uses the meta description."
            />
            <ImageField
              control={control}
              name="og_image_url"
              label="Share image"
              description="1200 x 630 works best. Empty uses the page's own image or the site default."
            />
          </FieldGroup>

          <FieldGroup title="Advanced" hint="Leave these alone unless you know you need them.">
            <TextField
              control={control}
              name="canonical_path"
              label="Canonical URL"
              max={300}
              placeholder="Leave empty for this page's own URL"
              description="Only set this when the same content lives at another URL that should rank instead."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchField control={control} name="noindex" label="Hide from search (noindex)" />
              <SwitchField control={control} name="nofollow" label="Don't follow links (nofollow)" />
            </div>
          </FieldGroup>
        </div>

        <div className="space-y-4">
          <SnippetPreview
            title={values.meta_title || fallbackTitle}
            description={values.meta_description || fallbackDescription}
            url={pageUrl}
            noindex={values.noindex}
          />
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save SEO
          </Button>
        </div>
      </form>
    </Form>
  )
}

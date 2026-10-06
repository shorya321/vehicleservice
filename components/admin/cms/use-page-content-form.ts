'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type DefaultValues, type FieldValues, type Resolver, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { updatePageContent } from '@/app/admin/(shell)/content/pages/actions'

interface PageContentForm<T extends FieldValues> {
  form: UseFormReturn<T>
  saving: boolean
  save: (values: T) => Promise<void>
}

/**
 * Form state and the save round trip shared by every page content editor.
 * The server re-validates against the page's own template, so the resolver
 * only drives the inline messages.
 */
export function usePageContentForm<T extends FieldValues>(
  pageId: string,
  /** `zodResolver(templateSchema)`, built by the caller so its types resolve. */
  resolver: Resolver<T>,
  initialContent: T
): PageContentForm<T> {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const form = useForm<T>({ resolver, defaultValues: initialContent as DefaultValues<T> })

  async function save(values: T): Promise<void> {
    setSaving(true)
    try {
      const result = await updatePageContent(pageId, values)
      if (!result.success) {
        toast.error(result.error ?? 'Could not save the page')
        return
      }
      toast.success('Page saved and live')
      form.reset(values)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Could not save the page. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return { form, saving, save }
}

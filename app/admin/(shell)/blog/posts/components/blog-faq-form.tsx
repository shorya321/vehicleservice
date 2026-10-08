'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Form } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FaqListEditor } from '@/components/admin/cms/faq-list-editor'
import { SaveBar } from '@/components/admin/cms/save-bar'
import { blogFaqSchema, cleanFaqs, type BlogFaq } from '@/lib/blog/sections'
import { updateBlogPostFaqs } from '../actions'

interface FaqFormValues {
  faqs: BlogFaq[]
}

interface BlogFaqFormProps {
  postId: string
  initialFaqs: BlogFaq[]
  /** Drafts are not public, so the button only says Save. */
  draft: boolean
}

const EMPTY_ROW: BlogFaq = { question: '', answer: '' }

/** FAQ tab of the post editor. Saves on its own, separately from Content and SEO. */
export function BlogFaqForm({ postId, initialFaqs, draft }: BlogFaqFormProps) {
  const [saving, setSaving] = useState(false)
  // The list editor never removes its last row, so an empty FAQ starts as one blank row.
  const form = useForm<FaqFormValues>({
    defaultValues: { faqs: initialFaqs.length > 0 ? initialFaqs : [EMPTY_ROW] },
  })

  const onSubmit = async (values: FaqFormValues) => {
    // Check row by row so an error lands on the row the admin sees, blank rows included.
    let valid = true
    values.faqs.forEach((row, i) => {
      if (!cleanFaqs([row]).length) return
      const parsed = blogFaqSchema.safeParse(row)
      if (parsed.success) return
      valid = false
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (key === 'question' || key === 'answer') form.setError(`faqs.${i}.${key}`, { message: issue.message })
      }
    })
    if (!valid) {
      toast.error('Fill in both the question and the answer, or clear both')
      return
    }
    const faqs = cleanFaqs(values.faqs)

    setSaving(true)
    try {
      const result = await updateBlogPostFaqs(postId, faqs)
      if (result.error) {
        toast.error(result.error)
        return
      }
      form.reset({ faqs: faqs.length > 0 ? faqs : [EMPTY_ROW] })
      toast.success(faqs.length > 0 ? 'FAQs saved' : 'FAQs removed from this post')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the FAQs')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ</CardTitle>
        <CardDescription>
          Shown at the end of the article and listed in its &quot;On this page&quot; menu. Clear both fields of a question to remove it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FaqListEditor control={form.control} name="faqs" />
            <SaveBar saving={saving} dirty={form.formState.isDirty} draft={draft} />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

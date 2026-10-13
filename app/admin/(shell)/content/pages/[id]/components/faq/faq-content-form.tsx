'use client'

import { useState } from 'react'
import type { FieldErrors, FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/admin/cms/text-field'
import { EDITOR_TAB_TRIGGER, SaveBar } from '@/components/admin/cms/save-bar'
import { usePageContentForm } from '@/components/admin/cms/use-page-content-form'
import { faqContentSchema, type FaqContent, type FaqSectionKey } from '@/lib/cms/templates/faq/schema'
import { FaqTopicsFields } from './faq-topics-fields'

const TABS: { key: FaqSectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'topics', label: 'Topics and questions' },
]

const p = (value: string): FieldPath<FaqContent> => value as FieldPath<FaqContent>

export function FaqContentForm({ pageId, initialContent }: { pageId: string; initialContent: FaqContent }) {
  const [tab, setTab] = useState<FaqSectionKey>('hero')
  const { form, saving, save } = usePageContentForm(pageId, zodResolver(faqContentSchema), initialContent)
  const { control } = form
  const errors = form.formState.errors

  function onInvalid(found: FieldErrors<FaqContent>): void {
    const first = TABS.find((t) => found[t.key])
    if (first) {
      setTab(first.key)
      toast.error(`Fix the highlighted fields in ${first.label}`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save, onInvalid)} className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as FaqSectionKey)}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 border bg-card p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className={EDITOR_TAB_TRIGGER}>
                {t.label}
                {errors[t.key] && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-destructive" aria-label="has errors" />}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 rounded-lg border bg-card/50 p-4 sm:p-6">
            <TabsContent value="hero" className="space-y-4">
              <TextField control={control} name={p('hero.eyebrow')} label="Eyebrow" max={40} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={control} name={p('hero.title')} label="Main heading (H1)" max={60} />
                <TextField control={control} name={p('hero.accent')} label="Gold last words" max={30} />
              </div>
              <TextField control={control} name={p('hero.body')} label="Intro text" max={240} rows={2} />
            </TabsContent>

            <TabsContent value="topics">
              <FaqTopicsFields control={control} />
            </TabsContent>

          </div>
        </Tabs>

        <SaveBar saving={saving} dirty={form.formState.isDirty} />
      </form>
    </Form>
  )
}

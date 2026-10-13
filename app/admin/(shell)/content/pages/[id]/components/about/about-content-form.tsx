'use client'

import { useState } from 'react'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EDITOR_TAB_TRIGGER, SaveBar } from '@/components/admin/cms/save-bar'
import { usePageContentForm } from '@/components/admin/cms/use-page-content-form'
import { aboutContentSchema, type AboutContent, type AboutSectionKey } from '@/lib/cms/templates/about/schema'
import { AboutHeroFields } from './about-hero-fields'
import { AboutCloseFields, AboutStepsFields, AboutValuesFields } from './about-section-fields'
import { AboutPlacesFields } from './about-places-fields'

const TABS: { key: AboutSectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'steps', label: 'How it works' },
  { key: 'values', label: 'Standard' },
  { key: 'places', label: 'Places' },
  { key: 'close', label: 'Closing panel' },
]

export function AboutContentForm({ pageId, initialContent }: { pageId: string; initialContent: AboutContent }) {
  const [tab, setTab] = useState<AboutSectionKey>('hero')
  const { form, saving, save } = usePageContentForm(pageId, zodResolver(aboutContentSchema), initialContent)
  const { control } = form
  const errors = form.formState.errors

  function onInvalid(found: FieldErrors<AboutContent>): void {
    const first = TABS.find((t) => found[t.key])
    if (first) {
      setTab(first.key)
      toast.error(`Fix the highlighted fields in ${first.label}`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save, onInvalid)} className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as AboutSectionKey)}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 border bg-card p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className={EDITOR_TAB_TRIGGER}>
                {t.label}
                {errors[t.key] && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-destructive" aria-label="has errors" />}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 rounded-lg border bg-card/50 p-4 sm:p-6">
            <TabsContent value="hero"><AboutHeroFields control={control} /></TabsContent>
            <TabsContent value="steps"><AboutStepsFields control={control} /></TabsContent>
            <TabsContent value="values"><AboutValuesFields control={control} /></TabsContent>
            <TabsContent value="places"><AboutPlacesFields control={control} /></TabsContent>
            <TabsContent value="close"><AboutCloseFields control={control} /></TabsContent>
          </div>
        </Tabs>

        <SaveBar saving={saving} dirty={form.formState.isDirty} />
      </form>
    </Form>
  )
}

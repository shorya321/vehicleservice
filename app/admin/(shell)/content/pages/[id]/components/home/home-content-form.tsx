'use client'

import { useState } from 'react'
import type { FieldErrors } from 'react-hook-form'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EDITOR_TAB_TRIGGER, SaveBar } from '@/components/admin/cms/save-bar'
import { usePageContentForm } from '@/components/admin/cms/use-page-content-form'
import { homeContentSchema, type HomeContent, type HomeSectionKey } from '@/lib/cms/templates/home/schema'
import { HeroSection } from './hero-section'
import { FaqSection } from './faq-section'
import {
  AccountSection,
  AfterYouBookSection,
  BenefitsSection,
  CitiesSection,
  HeaderOnlySection,
  OnboardSection,
  TestimonialsSection,
} from './list-sections'

/** Tabs in page order, so the editor reads top to bottom like the page. */
const TABS: { key: HomeSectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'after_you_book', label: 'After you book' },
  { key: 'routes', label: 'Routes' },
  { key: 'cities', label: 'Cities' },
  { key: 'benefits', label: 'Promise' },
  { key: 'fleet', label: 'Fleet' },
  { key: 'onboard', label: 'Onboard' },
  { key: 'testimonials', label: 'Reviews' },
  { key: 'account', label: 'Account' },
  { key: 'faq', label: 'FAQ' },
]

interface HomeContentFormProps {
  pageId: string
  initialContent: HomeContent
}

export function HomeContentForm({ pageId, initialContent }: HomeContentFormProps) {
  const [tab, setTab] = useState<HomeSectionKey>('hero')
  const { form, saving, save } = usePageContentForm(pageId, zodResolver(homeContentSchema), initialContent)
  const { control } = form

  function onInvalid(errors: FieldErrors<HomeContent>): void {
    const first = TABS.find((t) => errors[t.key])
    if (first) {
      setTab(first.key)
      toast.error(`Fix the highlighted fields in ${first.label}`)
    }
  }

  const errors = form.formState.errors

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save, onInvalid)} className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as HomeSectionKey)}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 border bg-card p-1">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className={EDITOR_TAB_TRIGGER}
              >
                {t.label}
                {errors[t.key] && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-destructive" aria-label="has errors" />}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 rounded-lg border bg-card/50 p-4 sm:p-6">
            <TabsContent value="hero"><HeroSection control={control} /></TabsContent>
            <TabsContent value="after_you_book"><AfterYouBookSection control={control} /></TabsContent>
            <TabsContent value="routes">
              <HeaderOnlySection control={control} section="routes" note="Route cards come from routes marked Popular under Routes." />
            </TabsContent>
            <TabsContent value="cities"><CitiesSection control={control} /></TabsContent>
            <TabsContent value="benefits"><BenefitsSection control={control} /></TabsContent>
            <TabsContent value="fleet">
              <HeaderOnlySection control={control} section="fleet" note="Vehicle cards come from active vehicle types under Vehicle Types." />
            </TabsContent>
            <TabsContent value="onboard"><OnboardSection control={control} /></TabsContent>
            <TabsContent value="testimonials"><TestimonialsSection control={control} /></TabsContent>
            <TabsContent value="account"><AccountSection control={control} /></TabsContent>
            <TabsContent value="faq"><FaqSection control={control} /></TabsContent>
          </div>
        </Tabs>

        <SaveBar saving={saving} dirty={form.formState.isDirty} />
      </form>
    </Form>
  )
}

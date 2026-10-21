'use client'

import { useState } from 'react'
import type { FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EDITOR_TAB_TRIGGER, SaveBar } from '@/components/admin/cms/save-bar'
import { usePageContentForm } from '@/components/admin/cms/use-page-content-form'
import { servicesContentSchema, type ServicesContent, type ServicesSectionKey } from '@/lib/cms/templates/services/schema'
import {
  ServicesAirportFields,
  ServicesBeyondFields,
  ServicesHeroFields,
  ServicesHourlyFields,
  ServicesWaysFields,
} from './services-top-fields'
import { ServicesBusinessFields, ServicesFaqFields, ServicesFareFields, ServicesFleetFields } from './services-bottom-fields'
import type { ServicesControl } from './fields'

const TABS: { key: ServicesSectionKey; label: string; Fields: (props: { control: ServicesControl }) => React.ReactNode }[] = [
  { key: 'hero', label: 'Hero', Fields: ServicesHeroFields },
  { key: 'ways', label: 'Ways to book', Fields: ServicesWaysFields },
  { key: 'airport', label: 'Airport', Fields: ServicesAirportFields },
  { key: 'hourly', label: 'Hourly', Fields: ServicesHourlyFields },
  { key: 'beyond', label: 'Beyond Dubai', Fields: ServicesBeyondFields },
  { key: 'business', label: 'Business', Fields: ServicesBusinessFields },
  { key: 'fare', label: 'In the fare', Fields: ServicesFareFields },
  { key: 'fleet', label: 'Vehicles', Fields: ServicesFleetFields },
  { key: 'faq', label: 'FAQ', Fields: ServicesFaqFields },
]

export function ServicesContentForm({ pageId, initialContent }: { pageId: string; initialContent: ServicesContent }) {
  const [tab, setTab] = useState<ServicesSectionKey>('hero')
  const { form, saving, save } = usePageContentForm(pageId, zodResolver(servicesContentSchema), initialContent)
  const { control } = form
  const errors = form.formState.errors

  function onInvalid(found: FieldErrors<ServicesContent>): void {
    const first = TABS.find((t) => found[t.key])
    if (first) {
      setTab(first.key)
      toast.error(`Fix the highlighted fields in ${first.label}`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save, onInvalid)} className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ServicesSectionKey)}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 border bg-card p-1">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className={EDITOR_TAB_TRIGGER}>
                {t.label}
                {errors[t.key] && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-destructive" aria-label="has errors" />}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 rounded-lg border bg-card/50 p-4 sm:p-6">
            {TABS.map(({ key, Fields }) => (
              <TabsContent key={key} value={key}><Fields control={control} /></TabsContent>
            ))}
          </div>
        </Tabs>

        <SaveBar saving={saving} dirty={form.formState.isDirty} />
      </form>
    </Form>
  )
}

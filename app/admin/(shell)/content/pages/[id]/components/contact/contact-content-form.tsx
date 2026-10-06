'use client'

import { useState } from 'react'
import type { FieldErrors, FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/admin/cms/text-field'
import { SwitchField } from '@/components/admin/cms/switch-field'
import { FaqListEditor } from '@/components/admin/cms/faq-list-editor'
import { EDITOR_TAB_TRIGGER, SaveBar } from '@/components/admin/cms/save-bar'
import { usePageContentForm } from '@/components/admin/cms/use-page-content-form'
import { contactContentSchema, type ContactContent, type ContactSectionKey } from '@/lib/cms/templates/contact/schema'

const TABS: { key: ContactSectionKey; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'details', label: 'Contact details' },
  { key: 'promises', label: 'After you write' },
  { key: 'faq', label: 'FAQ' },
]

const p = (value: string): FieldPath<ContactContent> => value as FieldPath<ContactContent>

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">{children}</p>
)

export function ContactContentForm({ pageId, initialContent }: { pageId: string; initialContent: ContactContent }) {
  const [tab, setTab] = useState<ContactSectionKey>('hero')
  const { form, saving, save } = usePageContentForm(pageId, zodResolver(contactContentSchema), initialContent)
  const { control } = form
  const errors = form.formState.errors

  function onInvalid(found: FieldErrors<ContactContent>): void {
    const first = TABS.find((t) => found[t.key])
    if (first) {
      setTab(first.key)
      toast.error(`Fix the highlighted fields in ${first.label}`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save, onInvalid)} className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ContactSectionKey)}>
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
              <Note>Email and phone come from Settings, General, so they always match the header and footer.</Note>
              <TextField control={control} name={p('hero.eyebrow')} label="Eyebrow" max={40} />
              <TextField control={control} name={p('hero.title')} label="Main heading (H1)" max={90} recommended={60} />
              <TextField control={control} name={p('hero.body')} label="Intro text" max={320} rows={3} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={control} name={p('hero.reply.label')} label="Reply label" max={20} />
                <TextField control={control} name={p('hero.reply.value')} label="Reply value" max={40} />
                <TextField control={control} name={p('hero.desk.label')} label="Desk label" max={20} />
                <TextField control={control} name={p('hero.desk.value')} label="Desk value" max={40} />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Note>Office address, email and phone come from Settings, General.</Note>
              <TextField control={control} name={p('details.heading')} label="Heading" max={40} />
              <TextField control={control} name={p('details.hours')} label="Hours" max={60} />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-4 rounded-lg border bg-card p-4">
                  <TextField control={control} name={p('details.travelling.label')} label="Urgent card label" max={40} />
                  <TextField control={control} name={p('details.travelling.body')} label="Urgent card text" max={300} rows={3} />
                  <TextField control={control} name={p('details.travelling.cta_label')} label="Call button text" max={30} />
                </div>
                <div className="space-y-4 rounded-lg border bg-card p-4">
                  <TextField control={control} name={p('details.corporate.label')} label="Corporate card label" max={40} />
                  <TextField control={control} name={p('details.corporate.body')} label="Corporate card text" max={300} rows={3} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="promises" className="space-y-4">
              <SwitchField control={control} name={p('promises.visible')} label="Show this section" />
              <TextField control={control} name={p('promises.eyebrow')} label="Eyebrow" max={40} />
              <TextField control={control} name={p('promises.title')} label="Heading (H2)" max={90} recommended={60} />
              <div className="grid gap-4 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-4 rounded-lg border bg-card p-4">
                    <h4 className="text-sm font-semibold">Step 0{i + 1}</h4>
                    <TextField control={control} name={p(`promises.items.${i}.title`)} label="Title (H3)" max={60} />
                    <TextField control={control} name={p(`promises.items.${i}.body`)} label="Text" max={260} rows={3} />
                    <TextField control={control} name={p(`promises.items.${i}.meta`)} label="Footnote" max={40} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              <SwitchField control={control} name={p('faq.visible')} label="Show this section" />
              <TextField control={control} name={p('faq.eyebrow')} label="Eyebrow" max={40} />
              <TextField control={control} name={p('faq.title')} label="Heading (H2)" max={90} recommended={60} />
              <TextField control={control} name={p('faq.body')} label="Intro text" max={320} rows={3} />
              <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
                <TextField control={control} name={p('faq.cta.label')} label="Button text" max={40} />
                <TextField control={control} name={p('faq.cta.href')} label="Button link" max={300} placeholder="#contact-form" />
              </div>
              <FaqListEditor control={control} name="faq.items" />
            </TabsContent>
          </div>
        </Tabs>

        <SaveBar saving={saving} dirty={form.formState.isDirty} />
      </form>
    </Form>
  )
}

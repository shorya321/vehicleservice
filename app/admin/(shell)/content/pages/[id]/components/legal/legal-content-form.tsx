'use client'

import { useFieldArray, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Accordion } from '@/components/ui/accordion'
import { TextField } from '@/components/admin/cms/text-field'
import { SaveBar } from '@/components/admin/cms/save-bar'
import { usePageContentForm } from '@/components/admin/cms/use-page-content-form'
import { legalContentSchema, type LegalContent } from '@/lib/cms/templates/legal/schema'
import { LegalSectionItem } from './legal-section-item'

interface LegalContentFormProps {
  pageId: string
  initialContent: LegalContent
  /** The page is a draft, so saving does not publish it. */
  draft?: boolean
}

/** Terms and Privacy: the hero lines, then the policy as an ordered list of sections. */
export function LegalContentForm({ pageId, initialContent, draft = false }: LegalContentFormProps) {
  const { form, saving, save } = usePageContentForm(pageId, zodResolver(legalContentSchema), initialContent)
  const { control } = form
  const { fields, append, remove, move } = useFieldArray({ control, name: 'sections' })

  function onInvalid(errors: FieldErrors<LegalContent>): void {
    const broken = errors.sections
    const index = Array.isArray(broken) ? broken.findIndex(Boolean) : -1
    toast.error(index >= 0 ? `Fix the highlighted fields in section ${index + 1}` : 'Fix the highlighted fields')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save, onInvalid)} className="space-y-6">
        <div className="space-y-4 rounded-lg border bg-card/50 p-4 sm:p-6">
          <h3 className="text-base font-semibold">Header</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={control} name="hero.eyebrow" label="Eyebrow" max={30} />
            <TextField
              control={control}
              name="last_updated"
              label="Last updated"
              max={40}
              description="Shown as typed. Change it whenever the text below changes."
            />
          </div>
          <TextField control={control} name="hero.title" label="Main heading (H1)" max={70} />
          <TextField control={control} name="hero.intro" label="Intro text" max={220} rows={2} />
        </div>

        <div className="space-y-4 rounded-lg border bg-card/50 p-4 sm:p-6">
          <div>
            <h3 className="text-base font-semibold">Sections</h3>
            <p className="text-sm text-muted-foreground">
              Each section is an H2 with its own link (/page#anchor) and an entry in the contents list. Images, alignment
              and code blocks are removed on the live page.
            </p>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {fields.map((field, i) => (
              <LegalSectionItem
                key={field.id}
                control={control}
                index={i}
                total={fields.length}
                onMove={move}
                onRemove={remove}
              />
            ))}
          </Accordion>

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ id: `section-${fields.length + 1}`, title: '', toc_label: '', body: '' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add section
          </Button>
        </div>

        <SaveBar saving={saving} dirty={form.formState.isDirty} draft={draft} />
      </form>
    </Form>
  )
}

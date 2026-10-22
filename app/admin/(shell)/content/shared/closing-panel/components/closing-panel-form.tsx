'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Form } from '@/components/ui/form'
import { TextField } from '@/components/admin/cms/text-field'
import { SwitchField } from '@/components/admin/cms/switch-field'
import { ImageField } from '@/components/admin/cms/image-field'
import { SaveBar } from '@/components/admin/cms/save-bar'
import { closingPanelSchema, type ClosingPanelContent } from '@/lib/cms/blocks/closing-panel/schema'
import { updateClosingPanel } from '../../actions'

/** One editor for the panel above the footer on Blog, About and FAQ. */
export function ClosingPanelForm({ initialContent }: { initialContent: ClosingPanelContent }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const form = useForm<ClosingPanelContent>({ resolver: zodResolver(closingPanelSchema), defaultValues: initialContent })
  const { control } = form

  async function save(values: ClosingPanelContent): Promise<void> {
    setSaving(true)
    try {
      const result = await updateClosingPanel(values)
      if (!result.success) {
        toast.error(result.error ?? 'Could not save the section')
        return
      }
      toast.success('Saved. Live on Blog, About and FAQ')
      form.reset(values)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Could not save the section. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(save, () => toast.error('Fix the highlighted fields'))} className="space-y-6">
        <div className="space-y-4 rounded-lg border bg-card/50 p-4 sm:p-6">
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            Shows above the footer on every Blog page, About and FAQ. Changes here update all of them.
          </p>
          <SwitchField control={control} name="visible" label="Show this section" />
          <TextField control={control} name="eyebrow" label="Eyebrow" max={40} />
          <TextField control={control} name="title" label="Heading (H2)" max={90} recommended={60} />
          <TextField control={control} name="body" label="Text" max={320} rows={3} />
          <div className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <TextField control={control} name="primary.label" label="Main button text" max={40} />
            <TextField control={control} name="primary.href" label="Main button link" max={300} placeholder="/" />
            <TextField control={control} name="secondary.label" label="Second button text" max={40} />
            <TextField control={control} name="secondary.href" label="Second button link" max={300} placeholder="/contact" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {([0, 1, 2] as const).map((i) => (
              <TextField key={i} control={control} name={`trust.${i}`} label={`Reassurance ${i + 1}`} max={40} />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {([0, 1] as const).map((i) => (
              <div key={i} className="space-y-4">
                <ImageField control={control} name={`images.${i}`} label={`Photo ${i + 1}`} description="Portrait, about 480 x 600." />
                <TextField
                  control={control}
                  name={`imageAlts.${i}`}
                  label="Photo description (alt text)"
                  max={140}
                  description="Describe what the photo shows, for screen readers and image search."
                />
              </div>
            ))}
          </div>
        </div>

        <SaveBar saving={saving} dirty={form.formState.isDirty} />
      </form>
    </Form>
  )
}

'use client'

import { useFieldArray } from 'react-hook-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/admin/cms/text-field'
import { CtaFields, ItemCard, SectionHeaderFields, path, type HomeControl } from './fields'

const MAX_QUESTIONS = 20

export function FaqSection({ control }: { control: HomeControl }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'faq.items' })

  return (
    <div className="space-y-6">
      <SectionHeaderFields control={control} section="faq" />
      <CtaFields control={control} name="faq.cta" label="Button" />

      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        These questions are also sent to Google as FAQ structured data, exactly as written here.
      </p>

      <div className="space-y-4">
        {fields.map((field, i) => (
          <ItemCard
            key={field.id}
            title={`Question ${i + 1}`}
            actions={
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Move down"
                  disabled={i === fields.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete question"
                  disabled={fields.length === 1}
                  onClick={() => remove(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            }
          >
            <TextField control={control} name={path(`faq.items.${i}.question`)} label="Question (H3)" max={140} />
            <TextField control={control} name={path(`faq.items.${i}.answer`)} label="Answer" max={800} rows={4} />
          </ItemCard>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={fields.length >= MAX_QUESTIONS}
        onClick={() => append({ question: '', answer: '' })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add question
      </Button>
    </div>
  )
}

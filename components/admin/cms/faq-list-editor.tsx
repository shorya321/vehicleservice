'use client'

import { useFieldArray, type ArrayPath, type Control, type FieldArray, type FieldPath, type FieldValues } from 'react-hook-form'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextField } from './text-field'

const MAX_QUESTIONS = 20

interface FaqListEditorProps<T extends FieldValues> {
  control: Control<T>
  /** Path of the `{ question, answer }[]` list, e.g. `faq.items`. */
  name: ArrayPath<T>
}

/**
 * Question and answer list with add, delete and reorder. Every page's FAQ is
 * also published as FAQPage structured data, which the note below says.
 */
export function FaqListEditor<T extends FieldValues>({ control, name }: FaqListEditorProps<T>) {
  const { fields, append, remove, move } = useFieldArray({ control, name })
  const at = (i: number, key: 'question' | 'answer'): FieldPath<T> => `${name}.${i}.${key}` as FieldPath<T>

  return (
    <div className="space-y-4">
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        These questions are also sent to Google as FAQ structured data, exactly as written here.
      </p>

      {fields.map((field, i) => (
        <div key={field.id} className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Question {i + 1}</h4>
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
          </div>
          <TextField control={control} name={at(i, 'question')} label="Question (H3)" max={140} />
          <TextField control={control} name={at(i, 'answer')} label="Answer" max={800} rows={4} />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        disabled={fields.length >= MAX_QUESTIONS}
        onClick={() => append({ question: '', answer: '' } as FieldArray<T, ArrayPath<T>>)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add question
      </Button>
    </div>
  )
}

import type { Control, FieldPath } from 'react-hook-form'
import type { AboutContent } from '@/lib/cms/templates/about/schema'

export type AboutControl = Control<AboutContent>

/** Dynamic paths (`steps.items.0.title`) typed for react-hook-form. */
export const p = (value: string): FieldPath<AboutContent> => value as FieldPath<AboutContent>

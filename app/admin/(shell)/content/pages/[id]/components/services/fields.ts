import type { Control, FieldPath } from 'react-hook-form'
import type { ServicesContent } from '@/lib/cms/templates/services/schema'

export type ServicesControl = Control<ServicesContent>

/** Dynamic paths (`ways.items.0.title`) typed for react-hook-form. */
export const p = (value: string): FieldPath<ServicesContent> => value as FieldPath<ServicesContent>

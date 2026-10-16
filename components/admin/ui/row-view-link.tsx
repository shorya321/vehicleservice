'use client'

import * as React from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RowViewLinkProps {
  href: string
  label?: string
  className?: string
}

/**
 * Eye icon that opens a row's detail page. Stops the click from reaching a
 * clickable table row, so the row's own navigation does not fire twice.
 */
export function RowViewLink({ href, label = 'View details', className }: RowViewLinkProps): React.JSX.Element {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className
      )}
    >
      <Eye className="h-4 w-4" />
    </Link>
  )
}

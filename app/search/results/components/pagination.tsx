'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = [1]
  if (currentPage > 3) pages.push('...')
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }
  if (currentPage < totalPages - 2) pages.push('...')
  if (totalPages > 1) pages.push(totalPages)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-4 border-t border-[var(--graphite)] pt-8 sm:flex-row sm:justify-between"
    >
      <p className="text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        <span className="numeric text-[var(--text-secondary)]">
          {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        of{" "}
        <span className="numeric text-[var(--text-secondary)]">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-[var(--graphite)] px-3 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-[color,border-color,transform] duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)] motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Prev
        </button>

        <div className="flex items-center">
          {pages.map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="inline-flex h-10 min-w-6 items-center justify-center text-[var(--text-muted)]">
                  <span className="numeric">&hellip;</span>
                </span>
              )
            }
            const active = page === currentPage
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-label={`Page ${page}`}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex h-10 min-w-10 items-center justify-center px-2 text-[0.875rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)] ${active ? "numeric text-[var(--gold)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                <span className="numeric">{page}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="inline-flex h-10 items-center gap-1 rounded-[4px] border border-[var(--graphite)] px-3 text-[0.75rem] uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-[color,border-color,transform] duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)] motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black-void)]"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

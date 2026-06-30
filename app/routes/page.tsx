import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicRoutes } from './actions'
import { RoutesListClient } from '@/components/routes/routes-list-client'

export const metadata: Metadata = {
  title: 'Transfer Routes | Infinia Transfers',
  description: 'Browse all luxury transfer routes in Dubai. Popular routes highlighted. Book your private chauffeur transfer today.',
  openGraph: {
    title: 'Transfer Routes | Infinia Transfers',
    description: 'Browse all luxury transfer routes in Dubai. Book your private chauffeur transfer today.',
  },
}

const PAGE_LIMIT = 12

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function RoutesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1'))
  const todayDate = new Date().toISOString().split('T')[0]

  const { routes, total, totalPages } = await getPublicRoutes({ page, limit: PAGE_LIMIT })
  const startIndex = (page - 1) * PAGE_LIMIT

  return (
    <section
      aria-labelledby="routes-page-heading"
      className="editorial-section editorial-section--raised editorial-section--spacious"
    >
      <div className="luxury-container">
        <header className="max-w-2xl">
          <div className="editorial-eyebrow">Routes</div>
          <h1 id="routes-page-heading" className="editorial-section-title mt-5">
            All transfer routes.
          </h1>
          <p className="editorial-body mt-6">
            {total > 0
              ? `${total} routes available. Popular routes are highlighted. Tap a route to see vehicles and pricing for your date.`
              : 'No routes available at the moment. Check back soon.'}
          </p>
        </header>

        <div className="mt-12">
          <RoutesListClient
            routes={routes}
            todayDate={todayDate}
            startIndex={startIndex}
          />
        </div>

        {totalPages > 1 && (
          <nav aria-label="Routes pagination" className="mt-12 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/routes?page=${page - 1}`}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--graphite)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[rgba(var(--gold-rgb),0.06)] hover:text-[var(--text-primary)]"
              >
                Previous
              </Link>
            )}

            <div className="flex items-center gap-1">
              {generatePageNumbers(page, totalPages).map((pageNum, i) =>
                pageNum === null ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-[var(--text-muted)]">
                    &hellip;
                  </span>
                ) : (
                  <Link
                    key={pageNum}
                    href={`/routes?page=${pageNum}`}
                    aria-current={page === pageNum ? 'page' : undefined}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors ${
                      page === pageNum
                        ? 'bg-[var(--gold)] text-[var(--onyx)] font-medium'
                        : 'border border-[var(--graphite)] text-[var(--text-secondary)] hover:bg-[rgba(var(--gold-rgb),0.06)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              )}
            </div>

            {page < totalPages && (
              <Link
                href={`/routes?page=${page + 1}`}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--graphite)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[rgba(var(--gold-rgb),0.06)] hover:text-[var(--text-primary)]"
              >
                Next
              </Link>
            )}
          </nav>
        )}
      </div>
    </section>
  )
}

function generatePageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | null)[] = [1]

  if (current > 3) {
    pages.push(null)
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push(null)
  }

  pages.push(total)

  return pages
}

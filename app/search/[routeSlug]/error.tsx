'use client'

import { SearchErrorPanel } from '../results/components/search-error-panel'

export default function SearchRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SearchErrorPanel error={error} reset={reset} context="Search route page" />
}

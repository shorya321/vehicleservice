'use client'

import { SearchErrorPanel } from './components/search-error-panel'

export default function SearchResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <SearchErrorPanel error={error} reset={reset} context="Search results page" />
}

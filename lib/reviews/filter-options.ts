/**
 * Choices for the /reviews filter bar. Kept out of the client component so the
 * server page can validate the address against the same lists.
 */
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
] as const

export type ReviewSortValue = (typeof SORT_OPTIONS)[number]['value']

export const SORT_VALUES: readonly string[] = SORT_OPTIONS.map((option) => option.value)

export const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
  { value: '1', label: '1+ Stars' },
] as const

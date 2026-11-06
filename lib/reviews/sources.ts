/**
 * Where a review came from. 'customer' is a review the traveller left on the
 * site; every other value is feedback an admin entered from that channel.
 * The database enforces the same list (reviews_source_check).
 */
export const ADMIN_REVIEW_SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp', cardLabel: 'Via WhatsApp' },
  { value: 'email', label: 'Email', cardLabel: 'Via email' },
  { value: 'phone', label: 'Phone call', cardLabel: 'Via phone' },
  { value: 'google', label: 'Google review', cardLabel: 'Via Google' },
  { value: 'in_person', label: 'In person', cardLabel: 'In person' },
  { value: 'other', label: 'Other', cardLabel: 'Traveller feedback' },
] as const

export type AdminReviewSource = (typeof ADMIN_REVIEW_SOURCES)[number]['value']
export type ReviewSource = 'customer' | AdminReviewSource

export const ADMIN_REVIEW_SOURCE_VALUES = ADMIN_REVIEW_SOURCES.map((s) => s.value) as [
  AdminReviewSource,
  ...AdminReviewSource[],
]

/** A review left on the site is tied to a booking, so it reads as a verified trip. */
export const CUSTOMER_SOURCE_LABEL = 'Verified trip'

export function isAdminEntered(source: string | null | undefined): boolean {
  return Boolean(source) && source !== 'customer'
}

/** The short label shown on a public review card. */
export function reviewSourceLabel(source: string | null | undefined): string {
  if (!isAdminEntered(source)) return CUSTOMER_SOURCE_LABEL
  return ADMIN_REVIEW_SOURCES.find((s) => s.value === source)?.cardLabel ?? 'Traveller feedback'
}

/** The admin-facing name of a source, e.g. "WhatsApp". */
export function reviewSourceName(source: string | null | undefined): string {
  if (!isAdminEntered(source)) return 'Customer on site'
  return ADMIN_REVIEW_SOURCES.find((s) => s.value === source)?.label ?? 'Other'
}

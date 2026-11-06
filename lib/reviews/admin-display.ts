import { isAdminEntered, reviewSourceName } from './sources'

interface ReviewWho {
  source?: string | null
  reviewer_name?: string | null
  customer: { full_name: string | null; email: string | null; avatar_url?: string | null } | null
}

export interface AdminReviewerLabel {
  name: string
  /** The customer's email, or where an admin-entered review came from. */
  detail: string
  initials: string
  avatarUrl: string | null
}

/**
 * Who a review is from, as the admin pages show it. A customer review shows
 * the account; an admin-entered one shows the name typed in and its source,
 * so the two are never confused in moderation.
 */
export function adminReviewerLabel(review: ReviewWho): AdminReviewerLabel {
  const adminEntered = isAdminEntered(review.source)
  const name = adminEntered
    ? review.reviewer_name?.trim() || 'Unnamed reviewer'
    : review.customer?.full_name?.trim() || review.customer?.email?.split('@')[0] || 'Deleted customer'
  const detail = adminEntered
    ? `Added by admin, from ${reviewSourceName(review.source)}`
    : review.customer?.email ?? ''
  const initials = name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return { name, detail, initials, avatarUrl: adminEntered ? null : review.customer?.avatar_url ?? null }
}

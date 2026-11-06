/**
 * Admin-entered reviews: feedback a traveller gave outside the site. They must
 * always say where they came from and never read as a verified site review.
 */
import { adminReviewSchema } from '@/lib/reviews/admin-review-schema'
import { adminReviewerLabel } from '@/lib/reviews/admin-display'
import {
  ADMIN_REVIEW_SOURCES,
  CUSTOMER_SOURCE_LABEL,
  isAdminEntered,
  reviewSourceLabel,
  reviewSourceName,
} from '@/lib/reviews/sources'
import { buildHomeCards, type HomeReview } from '@/lib/reviews/home-record'

const VALID = {
  reviewerName: 'Sara Ahmed',
  rating: 5,
  reviewText: 'Driver waited at arrivals with a sign.',
  source: 'whatsapp',
  reviewDate: '2026-11-01',
  publish: true,
  isFeatured: false,
}

describe('review sources', () => {
  it('matches the list the database allows', () => {
    expect(ADMIN_REVIEW_SOURCES.map((s) => s.value)).toEqual(['whatsapp', 'email', 'phone', 'google', 'in_person', 'other'])
  })

  it('labels site reviews as verified and admin-entered ones by channel', () => {
    expect(reviewSourceLabel('customer')).toBe(CUSTOMER_SOURCE_LABEL)
    expect(reviewSourceLabel(undefined)).toBe(CUSTOMER_SOURCE_LABEL)
    expect(reviewSourceLabel('whatsapp')).toBe('Via WhatsApp')
    expect(reviewSourceLabel('google')).toBe('Via Google')
    expect(reviewSourceLabel('nonsense')).toBe('Traveller feedback')
  })

  it('never calls an admin-entered review verified', () => {
    ADMIN_REVIEW_SOURCES.forEach((s) => {
      expect(isAdminEntered(s.value)).toBe(true)
      expect(reviewSourceLabel(s.value).toLowerCase()).not.toContain('verified')
    })
    expect(isAdminEntered('customer')).toBe(false)
  })

  it('names sources for admins', () => {
    expect(reviewSourceName('customer')).toBe('Customer on site')
    expect(reviewSourceName('phone')).toBe('Phone call')
  })
})

describe('adminReviewSchema', () => {
  it('accepts a complete review and turns empty optional fields into null', () => {
    const parsed = adminReviewSchema.parse({ ...VALID, vehicleClass: '  ', routeFrom: '', routeTo: 'Dubai Marina' })
    expect(parsed.vehicleClass).toBeNull()
    expect(parsed.routeFrom).toBeNull()
    expect(parsed.routeTo).toBe('Dubai Marina')
  })

  it('rejects a review with no source, so its origin is always recorded', () => {
    expect(adminReviewSchema.safeParse({ ...VALID, source: '' }).success).toBe(false)
    expect(adminReviewSchema.safeParse({ ...VALID, source: 'customer' }).success).toBe(false)
  })

  it('needs a name, a rating from 1 to 5 and real words', () => {
    expect(adminReviewSchema.safeParse({ ...VALID, reviewerName: '   ' }).success).toBe(false)
    expect(adminReviewSchema.safeParse({ ...VALID, rating: 0 }).success).toBe(false)
    expect(adminReviewSchema.safeParse({ ...VALID, rating: 6 }).success).toBe(false)
    expect(adminReviewSchema.safeParse({ ...VALID, reviewText: 'Good' }).success).toBe(false)
    expect(adminReviewSchema.safeParse({ ...VALID, reviewText: 'x'.repeat(1001) }).success).toBe(false)
  })

  it('needs a calendar date', () => {
    expect(adminReviewSchema.safeParse({ ...VALID, reviewDate: '01/11/2026' }).success).toBe(false)
  })
})

describe('adminReviewerLabel', () => {
  it('shows the account for a customer review', () => {
    const who = adminReviewerLabel({
      source: 'customer',
      customer: { full_name: 'Noor Ali', email: 'noor@example.com', avatar_url: 'a.png' },
    })
    expect(who).toEqual({ name: 'Noor Ali', detail: 'noor@example.com', initials: 'NA', avatarUrl: 'a.png' })
  })

  it('shows the typed name and source for an admin-entered review', () => {
    const who = adminReviewerLabel({ source: 'email', reviewer_name: 'Tom Reid', customer: null })
    expect(who.name).toBe('Tom Reid')
    expect(who.detail).toBe('Added by admin, from Email')
    expect(who.avatarUrl).toBeNull()
  })

  it('copes with a customer review whose account is gone', () => {
    expect(adminReviewerLabel({ source: 'customer', customer: null }).name).toBe('Deleted customer')
  })
})

describe('home cards for admin-entered reviews', () => {
  const base: HomeReview = {
    id: 'a1',
    rating: 4,
    review_text: 'Clean car, on time.',
    route_from: null,
    route_to: null,
    created_at: '2026-10-15T08:00:00.000Z',
  }

  it('uses the typed name, shortened, and the source label', () => {
    const [card] = buildHomeCards([{ ...base, source: 'whatsapp', reviewer_name: 'Sara Ahmed' }], new Map())
    expect(card.name).toBe('Sara A.')
    expect(card.sourceLabel).toBe('Via WhatsApp')
  })

  it('never borrows a profile name for an admin-entered review', () => {
    const [card] = buildHomeCards(
      [{ ...base, source: 'phone', reviewer_name: 'Tom Reid', customer_id: 'c1' }],
      new Map([['c1', 'Someone Else']])
    )
    expect(card.name).toBe('Tom R.')
  })

  it('keeps "Verified trip" for site reviews', () => {
    const [card] = buildHomeCards([{ ...base, source: 'customer', customer_id: 'c1' }], new Map([['c1', 'Noor Ali']]))
    expect(card.sourceLabel).toBe('Verified trip')
    expect(card.name).toBe('Noor A.')
  })
})

/**
 * DEVELOPMENT-ONLY sample reviews for the home "Travellers on record" section
 * and the /reviews page.
 *
 * The reviews table is empty, which leaves both pages in their empty state.
 * These let local design work see the populated layout. They are sample copy,
 * not customer reviews, and must never reach real visitors:
 *
 * - they render only when NODE_ENV is 'development' (`next build` and
 *   `next start` run as 'production', so Vercel and Coolify never show them);
 * - real reviews always win, even in development.
 *
 * Do not widen this gate or seed these values into the database: the database
 * is shared with the live site.
 */

export interface DevSampleReview {
  id: string
  rating: number
  review_text: string
  route_from: string
  route_to: string
  vehicle_class: string
  source: 'other'
  reviewer_name: string
  is_featured: boolean
  created_at: string
}

export const DEV_SAMPLE_REVIEWS: readonly DevSampleReview[] = [
  {
    id: 'dev-sample-1',
    rating: 5,
    review_text:
      'Booked a late pickup for my parents. Their flight landed almost two hours late and the driver waited, kept me updated on WhatsApp and helped with the bags. Clean car, cold water, and the fare was the one I paid at booking.',
    route_from: 'Dubai Intl (DXB)',
    route_to: 'Dubai Marina',
    vehicle_class: 'Business Class',
    source: 'other',
    reviewer_name: 'Priya Sharma',
    is_featured: true,
    created_at: '2026-10-14T06:00:00.000Z',
  },
  {
    id: 'dev-sample-2',
    rating: 4,
    review_text:
      'Seven of us with a lot of luggage and the van fit everything. Pickup was a few minutes late, but the driver messaged ahead so we knew where to wait.',
    route_from: 'Downtown Dubai',
    route_to: 'Dubai World Central (DWC)',
    vehicle_class: 'Van',
    source: 'other',
    reviewer_name: 'Daniel Okafor',
    is_featured: true,
    created_at: '2026-09-08T06:00:00.000Z',
  },
  {
    id: 'dev-sample-3',
    rating: 5,
    review_text:
      'Early morning airport run. Quiet, calm driver, the car was spotless and he walked my parents to the check-in desk.',
    route_from: 'Palm Jumeirah',
    route_to: 'Dubai Intl (DXB)',
    vehicle_class: 'First Class',
    source: 'other',
    reviewer_name: 'Fatima Al Hashimi',
    is_featured: true,
    created_at: '2026-08-20T06:00:00.000Z',
  },
  {
    id: 'dev-sample-4',
    rating: 5,
    review_text:
      'Used it for a day trip to the Grand Mosque in Abu Dhabi and back. The driver knew where to drop us for the visitor entrance and was parked outside when we came out two hours later.',
    route_from: 'Business Bay',
    route_to: 'Sheikh Zayed Grand Mosque, Abu Dhabi',
    vehicle_class: 'Business Class',
    source: 'other',
    reviewer_name: 'Tom Becker',
    is_featured: false,
    created_at: '2026-07-11T06:00:00.000Z',
  },
  {
    id: 'dev-sample-5',
    rating: 4,
    review_text:
      'Booked the night before for a 6am meeting in Sharjah. Easy to book, the car was on time and the driver took the quicker road when Al Ittihad was backed up. The booking email could show the driver number sooner.',
    route_from: 'Jumeirah Lake Towers',
    route_to: 'Sharjah Expo Centre',
    vehicle_class: 'Economy',
    source: 'other',
    reviewer_name: 'Rahul Menon',
    is_featured: false,
    created_at: '2026-06-02T06:00:00.000Z',
  },
]

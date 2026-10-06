import type { HomeContent } from './schema'

/**
 * The home page as it shipped before it became editable, word for word. An
 * empty or unreadable `pages.content` row renders exactly this, so the page
 * never depends on the database to look right.
 */
export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    eyebrow: 'Airport & city transfers,',
    eyebrow_accent: 'fixed-price',
    title: 'Booked before you land.',
    summary:
      'Pick a route, choose a vehicle, confirm your transfer. Fixed pricing in your currency across 40+ cities.',
    trust: ['Fixed price at booking', 'Flight tracked', 'Free cancellation'],
    stats: [
      { label: 'Cities', value: '40+', is_rating: false },
      { label: 'Vehicles', value: '120+', is_rating: false },
      { label: 'Rating', value: '4.9', is_rating: true },
    ],
  },
  after_you_book: {
    visible: true,
    eyebrow: 'After you book',
    title: 'Booked. Then it all lives on one page.',
    body: "Your reference, your chauffeur's name, phone and plate, and your invoice. All in your account, from confirmation to kerbside.",
    primary_cta: { label: 'Book a transfer', href: '#hero' },
    secondary_cta: { label: 'Manage a booking', href: '/account?tab=bookings' },
  },
  routes: {
    visible: true,
    eyebrow: 'Routes',
    title: 'The routes travellers book most.',
    body: 'Short hops and long runs, each with the distance and the drive time we schedule against. Open one to see vehicles, capacity, and the final number for your date.',
  },
  cities: {
    visible: true,
    eyebrow: 'Where we run',
    title: 'Every corner of Dubai, one clock.',
    body: 'Every pickup, confirmation and cut-off on this site runs on Dubai time, whatever your phone is set to. No mental arithmetic at 5am.',
    items: [
      {
        name: 'Downtown',
        meta: '214 routes',
        image: '/images/cities/downtown.webp',
        alt: 'Burj Khalifa above the Sheikh Zayed Road interchange at dusk',
      },
      {
        name: 'Palm Jumeirah',
        meta: '96 routes',
        image: '/images/cities/palm-jumeirah.webp',
        alt: 'The fronds of Palm Jumeirah and Atlantis seen from the air at dawn',
      },
      {
        name: 'Dubai Marina',
        meta: '147 routes',
        image: '/images/cities/dubai-marina.webp',
        alt: 'Cayan Tower and the Dubai Marina berths seen across the water',
      },
      {
        name: 'Dubai Creek',
        meta: '63 routes',
        image: '/images/cities/dubai-creek.webp',
        alt: 'Abras crossing the creek in front of the old Deira waterfront',
      },
    ],
  },
  benefits: {
    visible: true,
    eyebrow: 'The promise',
    title: 'Specifics, not adjectives.',
    body: 'Three things we hold ourselves to on every transfer. Each one is measurable.',
    items: [
      {
        title: 'Booked in under two minutes.',
        body: 'Search a route, pick a vehicle, sign up free at checkout. Every return booking after that is faster, with no ads or upsells before confirmation.',
        meta: 'Search → Select → Confirm',
      },
      {
        title: 'Met at the door, not at a sign.',
        body: 'Your chauffeur arrives at the agreed gate, terminal, or address. For airport pickups, flight tracking adjusts the meet time without you having to write.',
        meta: 'Chauffeur at the gate',
      },
      {
        title: 'One price, in the currency you booked.',
        body: 'Fixed pricing at the moment of booking. No surge, no tip prompt, no waiting-time surcharge for traffic on the airport road.',
        meta: 'Multi-currency pricing',
      },
    ],
  },
  fleet: {
    visible: true,
    eyebrow: 'The fleet',
    title: 'A small fleet, kept in order.',
    body: 'Mercedes, BMW, and Cadillac on rotating annual leases. Choose by passenger count, luggage capacity, and the kind of arrival you want to make.',
  },
  onboard: {
    visible: true,
    eyebrow: 'Onboard',
    title: 'Quietly included.',
    body: 'The things travellers actually ask for, added at checkout or fitted before pickup. No upsell sequence.',
    items: [
      {
        title: 'Child seats',
        body: 'Age-appropriate seating provided on request: infant (up to 10kg), toddler (9-18kg), or booster (15-36kg). Installed before pickup.',
        meta: 'Added at checkout',
        image: '/images/onboard/child-seat.webp',
        alt: 'A father fastening a toddler into a child seat in the back of a car',
      },
      {
        title: 'Wi-Fi and refreshments',
        body: 'Complimentary on every transfer. Onboard router with international roaming, bottled water, and a selection of soft drinks.',
        meta: 'Included',
        image: '/images/onboard/in-car-refreshments.webp',
        alt: 'Two iced drinks resting in a car console, city towers through the window behind',
      },
      {
        title: 'Extended waiting',
        body: 'Hold the vehicle for an additional hour beyond the included grace period. Useful for delayed bag drop, customs, or unscheduled stops.',
        meta: '+1 hour included free',
        image: '',
        alt: '',
      },
      {
        title: 'Escorted from arrivals',
        body: 'Chauffeur waits inside arrivals with a signed name placard and walks you to the vehicle. Default on every airport transfer.',
        meta: 'Included',
        image: '',
        alt: '',
      },
    ],
  },
  testimonials: {
    visible: true,
    eyebrow: 'Spoken for',
    title: 'Travellers on record.',
    body: '',
    cta: { label: 'Read every review', href: '/reviews' },
  },
  account: {
    visible: true,
    eyebrow: 'Your account',
    title: 'One signup. Every ride faster after that.',
    body: 'A free account is part of every first booking. From then on your routes, passenger details and receipts stay in one place.',
    facts: [
      { title: 'Details on file', detail: 'Return bookings in seconds, passenger details already filled in.' },
      { title: 'Rebook in two taps', detail: 'Any past route, same vehicle class.' },
      { title: 'Every trip on record', detail: 'City, route, date, vehicle and receipt.' },
      { title: 'Priority support', detail: 'No queue, by phone or by email.' },
    ],
    primary_cta: { label: 'Create a free account', href: '/register' },
    secondary_cta: { label: 'Sign in', href: '/login' },
  },
  faq: {
    visible: true,
    eyebrow: 'Asked',
    title: 'Questions travellers actually ask.',
    body: 'If none of these covers it, our team replies within an hour during local business hours.',
    cta: { label: 'Write to support', href: '/contact' },
    items: [
      {
        question: 'How does pricing work?',
        answer:
          "Every transfer is fixed-price at the moment of booking. The number you see at checkout is the number on your card. No surge, no waiting-time surcharge, no driver-tip prompt. Prices are quoted in your selected currency; payment settles in AED at your bank's exchange rate.",
      },
      {
        question: 'Do I need an account to book?',
        answer:
          'Yes, a free account is created at checkout with your name, email, and a password. No email verification needed before your transfer is confirmed. The account stores your booking history and passenger details so return trips are faster.',
      },
      {
        question: 'How far in advance should I book?',
        answer:
          '24 hours is comfortable. Last-minute bookings under 3 hours are accepted on most routes and confirmed against live chauffeur availability. Same-day airport pickups are usually fine.',
      },
      {
        question: 'What happens if my flight is delayed?',
        answer:
          'We track the flight number you provided and shift the pickup time automatically. The chauffeur waits up to 45 minutes past the rescheduled arrival at no extra charge. Extended waiting can be added at checkout.',
      },
      {
        question: 'How do I find my driver at the airport?',
        answer:
          "Your chauffeur waits inside arrivals with a signed name placard and walks you to the vehicle. The driver's name and phone number appear on the confirmation page and again 30 minutes before pickup.",
      },
      {
        question: 'Is the price per person or per vehicle?',
        answer:
          'Per vehicle. Up to the listed passenger and luggage capacity. Taxes and tolls are included in the quoted total.',
      },
    ],
  },
}

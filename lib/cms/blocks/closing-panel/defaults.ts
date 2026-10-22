import type { ClosingPanelContent } from './schema'

/** Shipped copy, from the blog's original "Know the road" panel. */
export const DEFAULT_CLOSING_PANEL: ClosingPanelContent = {
  visible: true,
  eyebrow: 'Ready when you land',
  title: 'Know the road. Now ride it.',
  body: 'Pick a route, choose a vehicle, and the fare is fixed at booking. Your chauffeur tracks the flight, so a late landing costs nothing.',
  primary: { label: 'Find your transfer', href: '/' },
  secondary: { label: 'Browse vehicles', href: '/#fleet' },
  trust: ['Fixed price at booking', 'Flight tracked', 'Free cancellation'],
  images: ['/benefits/relaxed-safe-ride.jpg', '/benefits/easy-booking-process.jpg'],
  imageAlts: [
    'A smiling passenger checks her phone in the back seat',
    'A passenger pays for a ride by tapping a phone on a card reader',
  ],
}

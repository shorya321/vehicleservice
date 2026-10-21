import type { AboutContent } from './schema'
import { DEFAULT_ABOUT_TRUST } from './defaults-trust'

/**
 * Shipped About copy. Every number is a Terms clause: fixed fare, free
 * cancellation to 24 hours (half back from 24 to 12), 60 minutes of airport
 * waiting. Vendors own the vehicles and employ the drivers; never call them
 * our fleet.
 */
export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    eyebrow: 'About Infinia',
    title: 'The desk behind your',
    accent: 'driver.',
    body: 'We connect travellers with vetted local transport companies, fix the fare at booking, and stay on every trip until you arrive.',
    primary: { label: 'Book a transfer', href: '/' },
    secondary: { label: 'Contact the desk', href: '/contact' },
    feature: {
      image: '/benefits/meet-and-greet.jpg',
      alt: 'A driver opens the car door for an arriving passenger',
      tag: 'Arrivals',
      eyebrow: 'Our promise',
      title: 'Driver waiting, fare fixed, a person to call.',
      metaStart: 'Business Bay, Dubai',
      metaEnd: '',
    },
    stat: { eyebrow: 'Fixed fare', value: 'Nothing added', caption: 'at pickup' },
  },
  steps: {
    visible: true,
    eyebrow: 'How it works',
    title: 'Three parties, one promise.',
    items: [
      {
        tag: '01 You',
        title: 'Book the route.',
        body: 'Choose a vehicle class and pay once. Vehicle, driver, fuel, tolls and parking in one fare.',
        image: '/benefits/easy-booking-process.jpg',
      },
      {
        tag: '02 Partner',
        title: 'A vetted vendor drives.',
        body: 'The company owns the vehicle and employs the driver. Their details reach you before pickup.',
        image: '/services/driver-waiting.jpg',
      },
      {
        tag: '03 Our desk',
        title: 'We stay on the trip.',
        body: 'Flight tracked, car held 60 minutes after landing, any change handled.',
        image: '/benefits/relaxed-safe-ride.jpg',
      },
    ],
  },
  values: {
    visible: true,
    eyebrow: 'What we hold to',
    title: 'The standard, in numbers.',
    items: [
      { figure: '0', unit: 'AED', title: 'Added at the kerb.', body: 'What you see at checkout is what you pay. No surge and no meter.' },
      { figure: '24', unit: 'h', title: 'Free cancellation.', body: 'Cancel more than 24 hours before pickup for a full refund, 50% back from 24 to 12 hours. Full refund if we cancel.' },
      { figure: '60', unit: 'min', title: 'Free airport waiting.', body: 'Counted from the moment you land, with your flight tracked by the desk.' },
    ],
  },
  ...DEFAULT_ABOUT_TRUST,
}

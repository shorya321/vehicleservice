import type { AboutContent } from './schema'

/**
 * Shipped About copy. Every number is a Terms clause: fixed fare, free
 * cancellation to 24 hours, 60 minutes of airport waiting. Vendors own the
 * vehicles and employ the drivers; never call them our fleet.
 */
export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    eyebrow: 'About Infinia',
    title: 'The desk behind your',
    accent: 'driver.',
    body: 'We connect travellers with vetted local transport companies, fix the fare at booking, and stay on every trip until you arrive.',
    primary: { label: 'Book a transfer', href: '/' },
    secondary: { label: 'Contact the desk', href: '/contact' },
    figures: [
      { label: 'Free waiting', value: '60 min' },
      { label: 'Free cancel', value: '24 h' },
      { label: 'Desk', value: '24/7' },
    ],
    feature: {
      image: '/benefits/meet-and-greet.jpg',
      alt: 'A driver opens the car door for an arriving passenger',
      tag: 'Arrivals',
      eyebrow: 'Our promise',
      title: 'Driver waiting, fare fixed, a person to call.',
      metaStart: 'Business Bay, Dubai',
      metaEnd: 'Open 24/7',
    },
    note: { text: 'Vetted partner companies', label: 'How it works', href: '#about-how' },
    stat: { eyebrow: 'Fixed fare', value: 'AED 0', caption: 'added at the kerb' },
  },
  steps: {
    visible: true,
    eyebrow: 'How it works',
    title: 'Three parties, one promise.',
    lede: 'You book with us. A partner company owns the car and employs the driver. Our desk watches the trip.',
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
    lede: 'Every claim here is in our Terms, so it holds on every trip.',
    items: [
      { figure: '0', unit: 'AED', title: 'Added at the kerb.', body: 'What you see at checkout is what you pay. No surge and no meter.' },
      { figure: '24', unit: 'h', title: 'Free cancellation.', body: 'Cancel up to 24 hours before pickup at no charge. Full refund if we cancel.' },
      { figure: '60', unit: 'min', title: 'Free airport waiting.', body: 'Counted from the moment you land, with your flight tracked by the desk.' },
    ],
  },
  places: {
    visible: true,
    eyebrow: 'Where trips start',
    title: 'Across the city, from one desk.',
    lede: 'Pickups from hotels, homes and both airports, run from Business Bay.',
    items: [
      { name: 'Downtown', note: 'Burj Khalifa, DIFC', image: '/images/cities/downtown.webp' },
      { name: 'Palm Jumeirah', note: 'Resorts and residences', image: '/images/cities/palm-jumeirah.webp' },
      { name: 'Dubai Marina', note: 'JBR and the Marina', image: '/images/cities/dubai-marina.webp' },
      { name: 'Dubai Creek', note: 'Deira and Bur Dubai', image: '/images/cities/dubai-creek.webp' },
    ],
  },
  close: {
    visible: true,
    eyebrow: 'Ready when you land',
    title: 'Search a route. See the fixed fare.',
    body: 'Pick a route, choose a vehicle, and the fare is fixed at booking. Questions first? A person at the desk answers, day or night.',
    primary: { label: 'Find your transfer', href: '/' },
    secondary: { label: 'Contact the desk', href: '/contact' },
    trust: ['Fixed price at booking', 'Flight tracked', 'Free cancellation'],
    images: ['/images/onboard/child-seat.webp', '/images/onboard/in-car-refreshments.webp'],
  },
}

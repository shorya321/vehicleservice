import type { ServicesContent } from './schema'

/**
 * Shipped /services copy, checked against the live site on 2026-10-21. Hourly
 * is sold as half-day (5 h) and full-day (10 h) packages with 12 hours'
 * notice; checkout sells child seats, Wi-Fi, refreshments and luggage extras
 * but no waiting time or stops; driver details go out on assignment. The
 * vehicle list is every active class and its largest car's capacity. Beyond
 * Dubai ships hidden: Abu Dhabi has no zone of its own yet.
 */
export const DEFAULT_SERVICES_CONTENT: ServicesContent = {
  hero: {
    eyebrow: 'Services',
    title: 'Car with Driver in Dubai, at One',
    accent: 'Fixed Fare',
    body: 'Airport pickups, city rides and drivers by the hour across Dubai. Pick a vehicle class, see the full fare, and pay once. Fuel, Salik and parking are already in it.',
    primary: { label: 'Book a transfer', href: '/#hero' },
    secondary: { label: 'Business accounts', href: '/business/signup' },
    chips: ['Fixed price at booking', 'Flight tracked', 'Booked online in minutes'],
    image: '/images/cities/downtown.webp',
    imageAlt: 'Downtown Dubai skyline at dusk',
    imageTag: 'Across Dubai',
  },
  ways: {
    visible: true,
    eyebrow: 'What we run',
    title: 'Four ways to book a car with a chauffeur.',
    items: [
      {
        title: 'Airport and city transfers',
        body: 'One way from DXB or Al Maktoum to your hotel, home or office, or point to point across Dubai. Airport pickups are met inside arrivals.',
        image: '/benefits/meet-and-greet.jpg',
        alt: 'A chauffeur holds the rear door open for a passenger',
        cta: { label: 'Book a one-way ride', href: '/?trip=one_way#hero' },
      },
      {
        title: 'Round trip',
        body: 'Out and back in one booking, with the return time set when you book. Both legs are paid once.',
        image: '/images/cities/dubai-marina.webp',
        alt: 'Dubai Marina towers above yachts moored on the water',
        cta: { label: 'Book a round trip', href: '/?trip=round_trip#hero' },
      },
      {
        title: 'Multi-city',
        body: 'Up to four legs in one booking, such as hotel to meeting to dinner to airport. Every leg is priced up front and paid once.',
        image: '/images/cities/dubai-creek.webp',
        alt: 'Abra boats and a dhow crossing Dubai Creek',
        cta: { label: 'Plan a multi-city trip', href: '/?trip=multi_city#hero' },
      },
      {
        title: 'Hourly chauffeur',
        body: 'Keep the car and driver for a half day or a full day of meetings, shopping or stops.',
        image: '/images/cities/palm-jumeirah.webp',
        alt: 'Boats crossing the water off Palm Jumeirah at sunset',
        cta: { label: 'Book by the hour', href: '/?trip=hourly#hero' },
      },
    ],
  },
  airport: {
    visible: true,
    eyebrow: 'Airport',
    title: 'Airport transfer in Dubai, met inside arrivals.',
    items: [
      {
        title: 'Meet and greet, included.',
        body: 'At DXB T1, T2 or T3 your chauffeur waits in the arrivals hall with a name board and walks you to the car.',
      },
      {
        title: '60 minutes free.',
        body: 'Waiting time counts from the actual landing time, not the scheduled one. After that, extra waiting may be charged.',
      },
      {
        title: 'Driver details before you land.',
        body: 'Your chauffeur\'s name, phone number and plate are emailed to you as soon as they are assigned, and show on your booking.',
      },
    ],
    note: 'Delays, terminals and waiting, answered:',
    link: { label: 'Airport questions', href: '/faq' },
  },
  hourly: {
    visible: true,
    eyebrow: 'Hourly',
    title: 'Private driver in Dubai, by the hour.',
    body: 'Choose the Hourly tab, set your start point and time, and pick a half day or a full day. The fare for the whole package is fixed at booking, with fuel, Salik tolls and parking included. Your chauffeur stays with the car between stops, so there is no rebooking and no waiting at a taxi rank.',
    points: [
      { label: 'Packages', value: 'Half day (5 hours) or full day (10 hours)' },
      { label: 'Notice', value: 'Book at least 12 hours before pickup' },
      { label: 'Price', value: 'Fixed per package and vehicle class, with a set distance included' },
    ],
    cta: { label: 'Book by the hour', href: '/?trip=hourly#hero' },
    image: '/services/driver-waiting.jpg',
    imageAlt: 'A chauffeur waits beside the car',
  },
  beyond: {
    visible: false,
    eyebrow: 'Beyond Dubai',
    title: 'Dubai to Abu Dhabi, and Al Maktoum Airport.',
    items: [
      {
        title: 'Dubai to Abu Dhabi',
        body: 'Door to door, about 1 hour 15 minutes to 2 hours to central Abu Dhabi depending on traffic. The fare is fixed at booking.',
      },
      {
        title: 'Al Maktoum Airport (DWC)',
        body: 'Enter Al Maktoum International as your pickup. The same 60-minute wait and arrivals meeting apply.',
      },
    ],
  },
  business: {
    visible: true,
    eyebrow: 'For business',
    title: 'One account for every guest and staff trip.',
    items: [
      { title: 'One dashboard.', body: 'Your team books every guest and staff transfer from one login.' },
      { title: 'One wallet.', body: 'Every trip is charged to the prepaid account wallet, with an invoice for each ride.' },
      { title: 'Same fixed fares.', body: 'The same fare rules and inclusions as a personal booking.' },
    ],
    primary: { label: 'Open a business account', href: '/business/signup' },
    secondary: { label: 'Talk to us', href: '/contact' },
  },
  fare: {
    visible: true,
    eyebrow: 'In the fare',
    title: 'What is in the fare, and what you can add.',
    included: [
      'Vehicle and chauffeur',
      'Fuel',
      'Salik tolls',
      'Parking',
      'Flight tracking on airport pickups',
      'Meet and greet inside arrivals',
      '60 minutes free waiting',
      '',
    ],
    extras: [
      'Child seat: infant (up to 10 kg), toddler (9 to 18 kg) or booster (15 to 36 kg), fitted before pickup',
      'In-car Wi-Fi',
      'Refreshments',
      'Extra luggage, golf clubs or a pet',
    ],
    onRequest: [
      'Extra waiting after the free 60 minutes, which may be charged',
      'A change of pickup time or an extra stop, through the desk',
      '',
      '',
    ],
    footnote: 'The fare is per vehicle, not per person, up to the listed seats and bags. UAE law requires a child seat for children under four.',
  },
  fleet: {
    visible: true,
    eyebrow: 'The vehicles',
    title: 'Pick the car by seats and suitcases.',
    items: [
      { name: 'Executive', seats: '3', bags: '2', models: 'Toyota Camry, Lexus ES, Tesla Model S' },
      { name: 'Mini van', seats: '6', bags: '5', models: 'Mercedes V-Class' },
      { name: 'Luxury SUV', seats: '6', bags: '4', models: 'Chevrolet Tahoe, GMC Yukon, Cadillac Escalade, Lexus LX, Range Rover, Mercedes G-Class' },
      { name: 'Van', seats: '12', bags: '12', models: 'Mercedes Sprinter' },
      { name: 'Ultra luxury', seats: '3', bags: '3', models: 'Mercedes S-Class, BMW 7 Series, Maybach, Rolls-Royce Phantom' },
    ],
    cta: { label: 'See the vehicles', href: '/#fleet' },
  },
  faq: {
    visible: true,
    eyebrow: 'Service questions',
    title: 'Questions before you book.',
    items: [
      {
        question: 'What chauffeur services do you offer in Dubai?',
        answer: 'Airport transfers, city transfers anywhere across Dubai, hourly chauffeur hire by the half day or full day, and round or multi-city trips. Every one is booked online at a fixed fare.',
      },
      {
        question: 'Is the price per person or per vehicle?',
        answer: 'Per vehicle, up to the listed passenger and luggage capacity. Fuel, Salik tolls and parking are included unless the booking page says otherwise.',
      },
      {
        question: 'Can I hire a car with a driver for a full day?',
        answer: 'Yes. Use the Hourly tab and choose the full-day package, which gives you the car and chauffeur for 10 hours. Book at least 12 hours before pickup.',
      },
      {
        question: 'How late can I book?',
        answer: 'Transfers can be booked for the same day, subject to live chauffeur availability, but 24 hours ahead is more comfortable. Hourly hire needs at least 12 hours\' notice.',
      },
      {
        question: 'Can my company book for guests?',
        answer: 'Yes. Business accounts let hotels, travel agents and companies book from one dashboard, with trips charged to the account wallet.',
      },
    ],
  },
}

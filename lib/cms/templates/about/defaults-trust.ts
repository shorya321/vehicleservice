import type { AboutContent } from './schema'

/**
 * The trust half of the About page. Vetting copy is limited to what onboarding
 * really checks (trade licence, insurance) and what the Terms name (vehicle
 * condition, removal). Never claim an RTA permit: vetting does not check one.
 * Company
 * facts only the owner can confirm (legal name, licence, founding year, desk
 * hours) ship blank and stay hidden until filled in admin.
 */
export const DEFAULT_ABOUT_TRUST: Pick<AboutContent, 'story' | 'vetting' | 'company' | 'partner' | 'faq'> = {
  story: {
    visible: true,
    eyebrow: 'Our story',
    title: 'Built for the minutes after you land.',
    paragraphs: [
      'Most bad trips start the same way. A driver who isn\'t there, a price that changes at the kerb, a phone number nobody answers. Infinia was set up to take those three problems away.',
      'We don\'t own a fleet. We work with established Dubai transport companies that already do this well, set one fixed fare for each trip, and keep a desk watching every booking until the passenger is dropped off.',
    ],
    image: '/images/cities/downtown.webp',
    imageAlt: 'Downtown Dubai skyline beside Business Bay, where the desk is based',
  },
  vetting: {
    visible: true,
    eyebrow: 'Who drives you',
    title: 'Vetted before their first trip.',
    items: [
      { title: 'Trade licence checked.', body: 'Each partner company shows a valid Dubai trade licence before it gets a booking.' },
      { title: 'Insurance on file.', body: 'We check each partner\'s insurance before onboarding and keep its expiry date on record.' },
      { title: 'Cars in condition.', body: 'We check vehicle condition before a partner joins.' },
      { title: 'Removed if they slip.', body: 'If a partner misses our standard, we investigate and remove them from the network.' },
    ],
    footnote: 'Licensing, insurance, vehicle condition and service standards are written into our Terms.',
  },
  company: {
    visible: true,
    eyebrow: 'The company',
    title: 'A real company you can reach.',
    legalName: '',
    licence: '',
    licenceIssuer: '',
    founded: '',
    deskHours: '',
    payments: 'Card payment at booking. Fares settle in AED.',
    zonesNote: 'Trips start across Dubai.',
    zonesLink: { label: 'See all routes', href: '/routes' },
  },
  partner: {
    visible: true,
    eyebrow: 'For transport companies',
    title: 'Run cars in Dubai? Fill more of them.',
    items: [
      { title: 'Paid before you drive.', body: 'Passengers pay in full at booking, so you never chase a fare.' },
      { title: 'Trips with details.', body: 'Flight number, passenger name, bags and pickup point arrive with every job.' },
      { title: 'One desk behind you.', body: 'Delays, changes and passenger calls run through our desk, not your dispatcher.' },
    ],
    primary: { label: 'Apply as a partner', href: '/become-vendor' },
    secondary: { label: 'Talk to our partner team', href: '/contact' },
    footnote: 'You need a valid Dubai trade licence and current insurance to apply.',
  },
  faq: {
    visible: true,
    eyebrow: 'About Infinia',
    title: 'Questions about how we work.',
    items: [
      {
        question: 'Is Infinia a taxi company?',
        answer: 'No. Infinia is a booking and coordination platform. Independent Dubai transport companies own the cars and employ the chauffeurs. We fix the fare, assign a vetted partner and follow the trip until drop-off.',
      },
      {
        question: 'Who is my driver employed by?',
        answer: 'Your driver works for the partner company that owns the vehicle. Their name and phone number are emailed to you once they are assigned and show on your booking page.',
      },
      {
        question: 'Who do I contact if something goes wrong?',
        answer: 'Contact us, not the partner. Quote your booking reference to our support team. We follow it up with the partner, and if a partner falls short of our standard, we remove them.',
      },
      {
        question: 'What is included in the fare?',
        answer: 'Vehicle, chauffeur, fuel, tolls and parking. The price at checkout is what is charged. It only changes if you change the trip, for example by adding a stop or switching vehicle class.',
      },
      {
        question: 'Do you only operate in Dubai?',
        answer: 'Yes, for now. Trips run within Dubai: the airports, hotels, homes and city zones. Contact us before you book a trip to another emirate.',
      },
    ],
  },
}

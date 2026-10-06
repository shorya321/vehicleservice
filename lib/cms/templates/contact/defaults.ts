import type { ContactContent } from './schema'

/** The contact page as it shipped before it became editable, word for word. */
export const DEFAULT_CONTACT_CONTENT: ContactContent = {
  hero: {
    eyebrow: 'Get in touch',
    title: 'Talk to the people who run the transfer.',
    body: 'Questions about a booking, corporate accounts, or feedback on a journey you have already taken. Every message reaches the concierge desk in Business Bay.',
    reply: { label: 'Reply', value: 'Within 24 hours' },
    desk: { label: 'Desk', value: 'Open 24 / 7' },
  },
  details: {
    heading: 'Contact details',
    hours: 'Available 24/7',
    travelling: {
      label: 'Travelling today',
      body: 'If your pickup is inside the next 12 hours, call the desk instead of writing. We track your flight and hold the car for 45 minutes after you land.',
      cta_label: 'Call the desk',
    },
    corporate: {
      label: 'Corporate accounts',
      body: 'Monthly invoicing, priority booking and a named account manager. Pick Corporate Services in the form and we set it up in one call.',
    },
  },
  promises: {
    visible: true,
    eyebrow: 'After you write',
    title: 'Three steps, then it is handled.',
    items: [
      {
        title: 'It lands with a person.',
        body: 'Messages go to the concierge desk in Business Bay, not a shared inbox that nobody owns.',
        meta: 'Business Bay, Dubai',
      },
      {
        title: 'You get an answer within 24 hours.',
        body: 'Most land the same hour during Dubai business hours. Anything urgent gets picked up by phone.',
        meta: 'Within 24 hours',
      },
      {
        title: 'Your booking is confirmed in writing.',
        body: 'Changes to pickup time, vehicle class or passenger count are confirmed by email before we move.',
        meta: 'Confirmed by email',
      },
    ],
  },
  faq: {
    visible: true,
    eyebrow: 'Asked',
    title: 'Questions travellers actually ask.',
    body: 'If none of these covers it, the form above reaches the same team. They reply within an hour during Dubai business hours.',
    cta: { label: 'Write to the desk', href: '#contact-form' },
    items: [
      {
        question: 'How do I book a transfer?',
        answer:
          'You can book a transfer through our website by selecting your pickup and drop-off locations, choosing your preferred vehicle class, and completing the booking form. Alternatively, contact our concierge team directly via phone or email for personalized assistance.',
      },
      {
        question: 'What is your cancellation policy?',
        answer:
          'We offer free cancellation up to 24 hours before your scheduled pickup. Cancellations made within 24 hours may be subject to a cancellation fee. For airport transfers, we recommend booking at least 48 hours in advance.',
      },
      {
        question: 'Do you offer corporate accounts?',
        answer:
          'Yes, we offer tailored corporate accounts with dedicated account management, priority booking, monthly invoicing, and volume-based pricing. Contact us via the "Corporate Services" option in the form above to learn more.',
      },
      {
        question: 'What areas do you serve?',
        answer:
          'We provide luxury transfer services across the UAE and select international cities. Core coverage includes Dubai, Abu Dhabi, Sharjah, and their airports, hotels, and business districts. Cross-emirate and intercity transfers are available on all routes.',
      },
    ],
  },
}

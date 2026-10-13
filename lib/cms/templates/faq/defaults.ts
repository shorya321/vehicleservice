import type { FaqContent } from './schema'

/**
 * Shipped FAQ copy. Pricing, waiting and cancellation answers restate the
 * Terms; vendors own the vehicles and employ the drivers, so never say our fleet.
 */
export const DEFAULT_FAQ_CONTENT: FaqContent = {
  hero: {
    eyebrow: 'Help centre',
    title: 'Questions,',
    accent: 'answered.',
    body: 'Pricing, pickups, delays and changes. Search below or jump to a topic.',
  },
  topics: [
    {
      name: 'Booking',
      blurb: 'Accounts, lead times and what a booking covers.',
      items: [
        {
          question: 'Do I need an account to book?',
          answer:
            'Yes. A free account is created at checkout with your name, email and a password. It stores your booking history and passenger details so return trips are faster.',
        },
        {
          question: 'How far in advance should I book?',
          answer:
            '24 hours is comfortable. Bookings under 3 hours are accepted on most routes and confirmed against live chauffeur availability. Same-day airport pickups are usually fine.',
        },
        {
          question: 'Can I book a round trip or several stops?',
          answer:
            'Yes. Choose Round trip, Multi-city or Hourly on the search bar. Every journey is priced up front and you pay once for the whole trip.',
        },
        {
          question: 'When is my booking confirmed?',
          answer:
            'As soon as payment succeeds. You receive a confirmation email with your booking reference, and the booking appears in your account.',
        },
      ],
    },
    {
      name: 'Pricing and payment',
      blurb: 'What the quoted price includes and how you pay.',
      items: [
        {
          question: 'How does pricing work?',
          answer:
            'Every transfer is fixed-price at the moment of booking. The number you see at checkout is the number on your card. Prices show in your selected currency and settle in AED at your bank exchange rate.',
        },
        {
          question: 'Is the price per person or per vehicle?',
          answer:
            'Per vehicle, up to the listed passenger and luggage capacity. Fuel, tolls and parking are included in the quoted total unless the booking page says otherwise.',
        },
        {
          question: 'How do I pay?',
          answer:
            'By credit or debit card at checkout, through our secure payment provider. The full amount is taken when you book.',
        },
        {
          question: 'Can the price change after I book?',
          answer:
            'No. The price only changes if you modify the trip, for example by adding a stop or changing the vehicle class, and you see the new total before you confirm.',
        },
      ],
    },
    {
      name: 'On the day',
      blurb: 'Meeting your chauffeur, delays and waiting time.',
      items: [
        {
          question: 'What happens if my flight is delayed?',
          answer:
            'We track the flight number you provided and shift the pickup time automatically. The chauffeur waits up to 60 minutes from the actual landing time at no extra charge.',
        },
        {
          question: 'How do I find my driver at the airport?',
          answer:
            'Your chauffeur waits in the arrivals hall with a name board and walks you to the vehicle. The name and phone number appear on your confirmation.',
        },
        {
          question: 'How long will the chauffeur wait at other pickups?',
          answer:
            '60 minutes from the scheduled pickup time at no charge. After that, extra waiting may be charged, and the chauffeur or our team will try to reach you before leaving.',
        },
      ],
    },
    {
      name: 'Changes and cancellations',
      blurb: 'Cancelling, refunds and no-shows.',
      items: [
        {
          question: 'Can I cancel for free?',
          answer:
            'Yes, more than 24 hours before pickup, for a full refund to your original payment method within 5 to 10 business days. Between 12 and 24 hours you receive 50%. Under 12 hours there is no refund.',
        },
        {
          question: 'What if you have to cancel?',
          answer:
            'If we cancel because of weather or other events outside our control, you choose a full refund or a new time at no extra cost.',
        },
        {
          question: 'What counts as a no-show?',
          answer:
            'Not reaching the pickup point within the free waiting time. A no-show booking is not refunded, so call the number on your confirmation if you are running late.',
        },
      ],
    },
    {
      name: 'Business accounts',
      blurb: 'Booking for guests and staff from one account.',
      items: [
        {
          question: 'Who are business accounts for?',
          answer:
            'Hotels, travel agents and companies that book transfers for guests or staff. Your team books from one dashboard and every trip is charged to the account wallet.',
        },
        {
          question: 'Who provides the vehicles?',
          answer:
            'Vetted local transport companies. They own the vehicles and employ the drivers; we fix the fare, take the booking and stay on the trip until you arrive.',
        },
      ],
    },
  ],
}

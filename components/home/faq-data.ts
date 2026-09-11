export interface FaqItem {
  readonly question: string
  readonly answer: string
}

/** Home FAQ copy. Rendered by ./faq-panel.tsx. */
export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "How does pricing work?",
    answer:
      "Every transfer is fixed-price at the moment of booking. The number you see at checkout is the number on your card. No surge, no waiting-time surcharge, no driver-tip prompt. Prices are quoted in your selected currency; payment settles in AED at your bank's exchange rate.",
  },
  {
    question: "Do I need an account to book?",
    answer:
      "Yes, a free account is created at checkout with your name, email, and a password. No email verification needed before your transfer is confirmed. The account stores your booking history and passenger details so return trips are faster.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "24 hours is comfortable. Last-minute bookings under 3 hours are accepted on most routes and confirmed against live chauffeur availability. Same-day airport pickups are usually fine.",
  },
  {
    question: "What happens if my flight is delayed?",
    answer:
      "We track the flight number you provided and shift the pickup time automatically. The chauffeur waits up to 60 minutes past the rescheduled arrival at no extra charge. Extended waiting can be added at checkout.",
  },
  {
    question: "How do I find my driver at the airport?",
    answer:
      "Your chauffeur waits inside arrivals with a signed name placard and walks you to the vehicle. The driver's name and phone number appear on the confirmation page and again 30 minutes before pickup.",
  },
  {
    question: "Is the price per person or per vehicle?",
    answer:
      "Per vehicle. Up to the listed passenger and luggage capacity. Taxes and tolls are included in the quoted total.",
  },
]

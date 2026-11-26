import type { LegalContent } from './schema'

/**
 * The cancellation and refund policy page (/refund). An empty `pages.content`
 * row renders exactly this. Edit the live copy in Admin > Pages.
 *
 * The rule itself (24 hours, full refund or nothing) is enforced in code by
 * lib/bookings/cancellation-policy.ts. Change both together, never one alone.
 */
export const DEFAULT_REFUND_CONTENT: LegalContent = {
  hero: {
    eyebrow: 'Legal document',
    title: 'Cancellation & Refund Policy',
    intro: 'When you can cancel a transfer, what you get back and how long the refund takes. Cancellations are made by email, measured from your scheduled pickup time.',
  },
  last_updated: '26 November 2026',
  sections: [
    {
      id: 'cancellation-timeline',
      title: 'Cancellation Timeline',
      toc_label: 'Cancellation timeline',
      body:
        '<p>Every transfer, airport pickup and hourly booking follows the same rule, measured from the scheduled pickup time.</p>' +
        '<ul>' +
        '<li><strong>More than 24 hours before pickup:</strong> free cancellation, full refund</li>' +
        '<li><strong>24 hours or less before pickup:</strong> no refund</li>' +
        '<li><strong>Booked less than 24 hours before pickup:</strong> non-refundable from the moment of booking</li>' +
        '<li><strong>No-show:</strong> no refund. A no-show is not reaching the pickup point within the free waiting time</li>' +
        '</ul>' +
        '<p>Bookings made before 26 November 2026 keep the cancellation terms that applied when they were booked.</p>',
    },
    {
      id: 'round-trips',
      title: 'Round Trips and Multi-City Trips',
      toc_label: 'Round trips',
      body:
        '<p>Each journey in a round trip or multi-city trip can be cancelled on its own, and the 24 hour rule applies to each journey from its own pickup time.</p>' +
        '<p>A round trip is priced with a saving for booking both journeys together. If you cancel one journey, the refund is that journey\'s fare less the round-trip saving.</p>',
    },
    {
      id: 'how-to-cancel',
      title: 'How to Cancel',
      toc_label: 'How to cancel',
      body:
        '<p>Cancellations are made by email. To cancel a transfer:</p>' +
        '<ul>' +
        '<li>Email <a href="mailto:{{support_email}}">{{support_email}}</a></li>' +
        '<li>Include your booking reference and the pickup date and time</li>' +
        '<li>For a round trip, say which journey you are cancelling, or both</li>' +
        '<li>We reply by email to confirm the cancellation and the refund amount</li>' +
        '</ul>' +
        '<blockquote><p>The time your email reaches us is the time of cancellation. Send it more than 24 hours before pickup to qualify for a full refund.</p></blockquote>',
    },
    {
      id: 'refund-processing',
      title: 'Refund Processing',
      toc_label: 'Refund processing',
      body:
        '<p>Once your cancellation is confirmed, the refund goes back to the card you paid with.</p>' +
        '<blockquote><p>Refunds usually appear within 5 to 10 working days, depending on your bank. International cards can take up to 14 working days.</p></blockquote>' +
        '<p>If a refund has not reached you after 10 working days, contact <a href="mailto:{{support_email}}">{{support_email}}</a> with your booking reference.</p>',
    },
    {
      id: 'if-we-cancel',
      title: 'If We Cancel',
      toc_label: 'If we cancel',
      body:
        '<p>If we or the transport company cancel your transfer, for any reason including weather or events outside our control, you choose a full refund or a new pickup time at no extra cost.</p>',
    },
    {
      id: 'changes',
      title: 'Changes to a Booking',
      toc_label: 'Changes',
      body:
        '<p>To change a pickup time, address or vehicle, contact us at <a href="mailto:{{support_email}}">{{support_email}}</a> more than 24 hours before pickup. Changes depend on availability, and a different route or vehicle may change the fare.</p>',
    },
    {
      id: 'exceptional-circumstances',
      title: 'Exceptional Circumstances',
      toc_label: 'Exceptional circumstances',
      body:
        '<p>Flight cancellations, medical emergencies and travel restrictions imposed by authorities can be reviewed case by case, even inside 24 hours. Contact us as soon as you know, with your booking reference and any supporting documents.</p>',
    },
    {
      id: 'contact',
      title: 'Contact',
      toc_label: 'Contact',
      body:
        '<p>Questions about a cancellation or refund: <a href="mailto:{{support_email}}">{{support_email}}</a>. This policy forms part of our <a href="/terms">Terms &amp; Conditions</a>.</p>',
    },
  ],
}

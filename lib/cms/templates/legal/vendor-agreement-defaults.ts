import type { LegalContent } from './schema'

/**
 * Starting copy for the vendor agreement, written to match what /become-vendor
 * promises (no upfront fee, commission on completed bookings, weekly payouts).
 * A draft for legal review: the page stays unpublished until an admin publishes
 * it, and the copy is edited in Admin > Pages rather than here.
 */
export const DEFAULT_VENDOR_AGREEMENT_CONTENT: LegalContent = {
  hero: {
    eyebrow: 'Legal',
    title: 'Vendor Agreement',
    intro: 'The terms between Infinia Transfers and the transport companies that fulfil transfers booked through our platform.',
  },
  last_updated: '7 October 2026',
  sections: [
    {
      id: 'parties-and-acceptance',
      title: 'Parties & Acceptance',
      toc_label: 'Parties and acceptance',
      body: '<p>This Vendor Agreement is between Infinia Transfers and the company that applies to provide transfer services through our platform. By submitting a vendor application, or by accepting any booking assigned to you, you agree to this agreement on behalf of your company.</p><p>The person submitting the application confirms that they are authorised to bind the company to these terms. Our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a> also apply to your use of the platform.</p>',
    },
    {
      id: 'definitions',
      title: 'Definitions',
      toc_label: 'Definitions',
      body: '<ul><li><strong>"Infinia Transfers"</strong>, <strong>"we"</strong> or <strong>"us"</strong> means the Infinia Transfers platform and the company that operates it</li><li><strong>"Vendor"</strong> or <strong>"you"</strong> means the transport company approved to fulfil bookings</li><li><strong>"Customer"</strong> means the person or business who books a transfer</li><li><strong>"Booking"</strong> means a confirmed, paid transfer reservation made through the platform</li><li><strong>"Chauffeur"</strong> means a driver you employ or engage to carry out a booking</li><li><strong>"Dashboard"</strong> means the vendor portal where you manage vehicles, chauffeurs, bookings and payouts</li></ul>',
    },
    {
      id: 'eligibility-and-onboarding',
      title: 'Eligibility & Onboarding',
      toc_label: 'Eligibility and onboarding',
      body: '<p>To be approved you must hold a valid trade licence, a registration number issued by your licensing authority, and current commercial insurance. We review every application and aim to respond within two business days.</p><p>We may ask for further documents before approval and may decline an application at our discretion. You must keep your documents current and upload renewals before they expire. An expired licence or policy may pause new assignments until it is replaced.</p>',
    },
    {
      id: 'vehicle-and-chauffeur-standards',
      title: 'Vehicle & Chauffeur Standards',
      toc_label: 'Vehicle and chauffeur standards',
      body: '<h3>Vehicles</h3><p>Every vehicle you list must be registered, insured, roadworthy, clean inside and out, and of the class it is listed under. Vehicle details and photos in your dashboard must be accurate.</p><h3>Chauffeurs</h3><p>Every chauffeur must hold a valid licence for the vehicle and the area of operation, be professionally presented, and treat customers with courtesy. You are responsible for checking that your chauffeurs meet these standards and any local licensing rules.</p>',
    },
    {
      id: 'bookings-and-assignments',
      title: 'Bookings & Assignments',
      toc_label: 'Bookings and assignments',
      body: '<p>We assign bookings to you through the dashboard. Once you accept an assignment you must carry it out as booked, including the pickup time, vehicle class, passenger and luggage details, and any special requests.</p><p>Keep your availability and your chauffeur and vehicle details up to date so that we only assign work you can fulfil. If you can no longer carry out an accepted booking, tell us immediately through the dashboard so we can arrange cover.</p>',
    },
    {
      id: 'commission-and-payouts',
      title: 'Commission & Payouts',
      toc_label: 'Commission and payouts',
      body: '<p>There is no fee to join. We charge a commission on completed bookings only, at the rate shown in your dashboard or agreed with you in writing.</p><p>Customers pay us at the time of booking. We pay your earnings, less commission, to the bank account in your dashboard on a weekly cycle. You are responsible for keeping your bank details correct and for any taxes due on your earnings.</p>',
    },
    {
      id: 'cancellations-and-no-shows',
      title: 'Cancellations & No-Shows',
      toc_label: 'Cancellations and no-shows',
      body: '<p>When a customer cancels within our cancellation policy, no payout is due for that booking. A late cancellation or customer no-show may still be paid in line with the policy in force at the time of booking.</p><p>If you cancel an accepted booking or fail to arrive, we may withhold the payout for it and recover any extra cost of arranging a replacement. Repeated failures may lead to suspension.</p>',
    },
    {
      id: 'insurance-and-liability',
      title: 'Insurance & Liability',
      toc_label: 'Insurance and liability',
      body: '<p>You must hold insurance that covers your vehicles, chauffeurs, passengers and third parties for the services you provide, and show proof of it on request.</p><p>You are responsible for the transfers you carry out and for the conduct of your chauffeurs. You agree to cover any loss, claim or fine that arises from your services or from a breach of this agreement, except where it was caused by us.</p>',
    },
    {
      id: 'conduct-and-customer-data',
      title: 'Conduct & Customer Data',
      toc_label: 'Conduct and customer data',
      body: '<p>Customer names, phone numbers, flight details and addresses are shared with you only to fulfil a booking. You must not use them for any other purpose, contact customers outside a booking, or offer them your services directly.</p><p>Keep customer data secure and delete it once it is no longer needed for the booking or for legal records. Report any loss or misuse of customer data to us immediately.</p>',
    },
    {
      id: 'suspension-and-termination',
      title: 'Suspension & Termination',
      toc_label: 'Suspension and termination',
      body: '<p>You may end this agreement at any time by giving us written notice, after completing any bookings you have already accepted.</p><p>We may suspend or end your account if you breach this agreement, let your licence or insurance lapse, receive repeated serious complaints, or act in a way that puts customers or our reputation at risk. Earnings for bookings completed before termination are still paid, less any amounts owed to us.</p>',
    },
    {
      id: 'changes-and-governing-law',
      title: 'Changes & Governing Law',
      toc_label: 'Changes and governing law',
      body: '<p>We may update this agreement from time to time. We will tell you about material changes before they take effect, and continuing to accept bookings after that date means you accept the updated terms.</p><p>This agreement is governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai, and the courts of Dubai have jurisdiction over any dispute.</p>',
    },
    {
      id: 'contact',
      title: 'Contact',
      toc_label: 'Contact',
      body: '<p>For questions about this agreement or your vendor account, contact our partner team at <a href="mailto:support@infiniatransfers.com">support@infiniatransfers.com</a>.</p>',
    },
  ],
}

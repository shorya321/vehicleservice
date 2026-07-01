import Link from 'next/link'

export function PrivacyContent() {
  return (
    <>
      <section id="introduction" className="scroll-mt-28">
        <h2>Introduction</h2>
        <p>
          Infinia Transfers operates a private airport and city transfer service across more than 40 cities worldwide. When you search for a route, book a vehicle, or contact our concierge team, we handle certain personal information to deliver the service you expect from us.
        </p>
        <p>
          This Privacy Policy explains what data we collect, why we collect it, who we share it with, and the choices available to you. It applies to our website, booking platform, and any communication between you and our team, whether by email, phone, or live chat.
        </p>
        <p>
          Our approach to privacy is straightforward: collect only what we need and protect it properly.
        </p>
      </section>

      <section id="information-we-collect" className="scroll-mt-28">
        <h2>Information We Collect</h2>

        <h3>Personal Information</h3>
        <p>When you create an account or place a booking, we collect:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Payment card details (processed by our payment provider; we do not store full card numbers)</li>
          <li>Billing address, where required by your payment method</li>
        </ul>

        <h3>Booking Information</h3>
        <p>Each booking generates data specific to your trip:</p>
        <ul>
          <li>Pickup and drop-off locations</li>
          <li>Travel dates and times</li>
          <li>Vehicle class selection</li>
          <li>Number of passengers and luggage requirements</li>
          <li>Flight number (for airport transfers)</li>
          <li>Special requests or instructions for your chauffeur</li>
        </ul>

        <h3>Technical Information</h3>
        <p>When you visit our website, we automatically collect:</p>
        <ul>
          <li>IP address and approximate location</li>
          <li>Browser type and version</li>
          <li>Device type and operating system</li>
          <li>Pages visited and time spent on each page</li>
          <li>Referring website or search terms that brought you to us</li>
        </ul>

        <h3>Cookies</h3>
        <p>
          We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how visitors use our website. See the <a href="#cookies-and-tracking">Cookies &amp; Tracking</a> section below for full details.
        </p>
      </section>

      <section id="how-we-use-your-information" className="scroll-mt-28">
        <h2>How We Use Your Information</h2>
        <p>We use your personal information for these purposes:</p>
        <ul>
          <li><strong>Booking fulfilment:</strong> confirming reservations, dispatching your vehicle, sending trip details to your assigned chauffeur, and processing payments</li>
          <li><strong>Communication:</strong> sending booking confirmations, reminders before your trip, and follow-up emails after your transfer</li>
          <li><strong>Service improvement:</strong> analysing booking patterns and website usage to improve our routes and vehicle selection</li>
          <li><strong>Legal compliance:</strong> meeting tax, accounting, and regulatory obligations in the jurisdictions where we operate</li>
          <li><strong>Marketing:</strong> with your explicit consent, sending occasional updates about new routes or seasonal offers. You can withdraw this consent at any time</li>
        </ul>
        <p>
          We do not sell your personal information to third parties or use your data to build advertising profiles.
        </p>
      </section>

      <section id="information-sharing" className="scroll-mt-28">
        <h2>Information Sharing</h2>
        <p>We share your information only when necessary to complete your booking or meet a legal requirement:</p>
        <ul>
          <li><strong>Vehicle provider partners:</strong> your chauffeur operator receives your name, pickup location, drop-off location, flight number, and any special instructions. They do not receive your email, phone number, or payment details</li>
          <li><strong>Payment processors:</strong> our payment partner handles card transactions under their own security standards and privacy policies. We transmit payment details over encrypted connections and do not store full card numbers on our servers</li>
          <li><strong>Analytics providers:</strong> we use analytics services to understand website traffic and improve our platform. These providers receive anonymised or pseudonymised technical data</li>
          <li><strong>Legal requirements:</strong> if required by law, court order, or regulatory authority, we will disclose information to the extent legally necessary. We will notify you where permitted</li>
        </ul>
        <p>
          All third parties we work with are bound by data processing agreements that restrict how they can use your information. They may only process it for the specific purpose we have engaged them for.
        </p>
      </section>

      <section id="data-retention" className="scroll-mt-28">
        <h2>Data Retention</h2>
        <p>We keep your data only as long as we have a clear reason to:</p>
        <ul>
          <li><strong>Booking records:</strong> retained for 7 years after the date of travel, as required for tax reporting, financial auditing, and dispute resolution</li>
          <li><strong>Marketing preferences:</strong> held until you withdraw your consent. Once you unsubscribe, we remove your details from our marketing lists within 30 days</li>
          <li><strong>Technical logs:</strong> server logs and analytics data are retained for 90 days, then automatically deleted</li>
          <li><strong>Account data:</strong> if you ask us to delete your account, we will remove your personal information within 30 days, except where retention is required by law</li>
        </ul>
      </section>

      <section id="your-rights" className="scroll-mt-28">
        <h2>Your Rights</h2>
        <p>You have the following rights over your personal information, regardless of where you are located:</p>
        <ul>
          <li><strong>Access:</strong> request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> ask us to update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> request that we delete your personal data, subject to legal retention requirements</li>
          <li><strong>Data portability:</strong> receive your data in a structured, machine-readable format so you can transfer it to another service</li>
          <li><strong>Withdraw consent:</strong> revoke any consent you have previously given, such as marketing communications</li>
          <li><strong>Complain:</strong> lodge a complaint with a supervisory authority in your jurisdiction if you believe we have not handled your data properly</li>
        </ul>
        <p>
          To exercise any of these rights, email us at <a href="mailto:support@infiniatransfers.com">support@infiniatransfers.com</a>. We will respond within 30 days. We may ask you to verify your identity before processing your request.
        </p>
      </section>

      <section id="cookies-and-tracking" className="scroll-mt-28">
        <h2>Cookies &amp; Tracking</h2>
        <p>Cookies are small text files stored on your device when you visit our website. We use two categories:</p>

        <h3>Essential Cookies</h3>
        <p>
          These cookies are required for the website to function. They keep you signed in during your session, remember your selected currency, and enable the booking process. You cannot disable these without breaking core functionality.
        </p>

        <h3>Analytics Cookies</h3>
        <p>
          These cookies help us understand how visitors navigate our website: which pages are visited most, where people drop off during booking, and which search routes are popular. This data is aggregated and does not identify you personally.
        </p>

        <h3>Managing Your Preferences</h3>
        <p>
          Most browsers let you block or delete cookies through their settings. Be aware that blocking essential cookies will prevent you from completing bookings. You can also opt out of analytics tracking by using browser extensions designed for that purpose.
        </p>
      </section>

      <section id="international-data-transfers" className="scroll-mt-28">
        <h2>International Data Transfers</h2>
        <p>
          Infinia Transfers operates across more than 40 cities worldwide. When you book a transfer in a different country, your booking information is shared with the local vehicle provider in that region. This means your data may cross international borders.
        </p>
        <p>
          We ensure that any international transfer of personal data is protected by appropriate safeguards, including standard contractual clauses where required, and that receiving parties maintain security standards consistent with this policy.
        </p>
      </section>

      <section id="childrens-privacy" className="scroll-mt-28">
        <h2>Children&apos;s Privacy</h2>
        <p>
          Our services are not directed at individuals under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately and we will delete it.
        </p>
      </section>

      <section id="security-measures" className="scroll-mt-28">
        <h2>Security Measures</h2>
        <p>Your data is protected by multiple layers of security:</p>
        <ul>
          <li><strong>Encryption:</strong> all data transmitted between your browser and our servers is encrypted using TLS. Sensitive data stored on our servers is encrypted at rest</li>
          <li><strong>Access controls:</strong> only team members who need access to personal data for their role can view it. Access is logged and reviewed</li>
          <li><strong>Infrastructure:</strong> our platform is hosted on infrastructure with regular security audits, intrusion detection, and automated threat monitoring</li>
          <li><strong>Payment security:</strong> payment processing is handled by PCI DSS-compliant providers. We never store full credit card numbers on our systems</li>
        </ul>
        <p>
          No system is completely immune to risk. If we ever discover a breach that affects your personal data, we will notify you and any relevant authorities without undue delay.
        </p>
      </section>

      <section id="changes-to-this-policy" className="scroll-mt-28">
        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or services. When we make material changes, we will notify you by email before they take effect.
        </p>
        <p>
          Minor clarifications or formatting updates will be posted here without individual notice. The &ldquo;Last updated&rdquo; date at the top of this page always reflects the most recent version. Continued use of our services after any update constitutes your acceptance of the revised policy.
        </p>
      </section>

      <section id="contact-us" className="scroll-mt-28">
        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or want to exercise any of your rights, reach out to us:
        </p>
        <ul>
          <li>Email: <a href="mailto:support@infiniatransfers.com">support@infiniatransfers.com</a></li>
          <li>Contact form: <Link href="/contact">infiniatransfers.com/contact</Link></li>
        </ul>
        <p>
          Our team typically responds within 24 hours. For data-related requests, we will acknowledge your inquiry within 48 hours and resolve it within 30 days.
        </p>
      </section>
    </>
  )
}

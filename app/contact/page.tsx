import { Metadata } from 'next'
import { ContactHero } from './components/contact-hero'

export const dynamic = 'force-dynamic'
import { ContactForm } from './components/contact-form'
import { ContactInfo } from './components/contact-info'
import { ContactFaq } from './components/contact-faq'

export const metadata: Metadata = {
  title: 'Contact Us | Infinia Transfers',
  description:
    'Get in touch with Infinia Transfers for luxury vehicle transfer services in Dubai. Our concierge team is available around the clock.',
  openGraph: {
    title: 'Contact Us | Infinia Transfers',
    description:
      'Have a question or need assistance? Reach out to our concierge team for premium transfer services.',
  },
}

export default function ContactPage() {
  return (
    <>
      <ContactHero />

      {/* Contact Form + Info Section */}
      <section className="section-padding bg-[var(--black-rich)]">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left: Contact Form (60%) */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>

            {/* Right: Info Cards (40%) */}
            <div className="lg:col-span-2">
              <ContactInfo />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-[var(--black-void)]">
        <div className="luxury-container">
          <div className="section-header">
            <p className="section-eyebrow">Common Questions</p>
            <h2 className="section-title font-serif">
              Frequently Asked Questions
            </h2>
            <div className="section-divider">
              <div className="section-divider-icon" />
            </div>
            <p className="section-subtitle">
              Find quick answers to the most common questions about our services.
            </p>
          </div>
          <ContactFaq />
        </div>
      </section>
    </>
  )
}

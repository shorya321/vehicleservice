import { Metadata } from 'next'
import { ContactHero } from './components/contact-hero'
import { ContactForm } from './components/contact-form'
import { ContactInfo } from './components/contact-info'
import { ContactPromises } from './components/contact-promises'
import { ContactFaq } from './components/contact-faq'

export const metadata: Metadata = {
  title: 'Contact Us',
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

      <section
        id="contact-form"
        className="editorial-section editorial-section--raised"
      >
        <div className="luxury-container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:items-start">
            <ContactForm />
            <ContactInfo />
          </div>
        </div>
      </section>

      <ContactPromises />

      <section
        aria-labelledby="contact-faq-heading"
        className="editorial-section editorial-section--raised"
      >
        <div className="luxury-container">
          <ContactFaq />
        </div>
      </section>
    </>
  )
}

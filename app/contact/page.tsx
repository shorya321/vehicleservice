import { Metadata } from 'next'
import { ContactHero } from './components/contact-hero'
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

      <section className="py-10 md:py-16 bg-[var(--black-rich)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
            <div className="lg:col-span-2">
              <ContactInfo />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-[var(--black-void)] border-t border-[var(--graphite)]">
        <div className="luxury-container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)] mb-8 md:mb-10 [text-wrap:balance]">
              Common Questions
            </h2>
          </div>
          <ContactFaq />
        </div>
      </section>
    </>
  )
}

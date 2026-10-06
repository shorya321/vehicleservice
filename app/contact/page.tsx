import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { ContactHero } from './components/contact-hero'
import { ContactForm } from './components/contact-form'
import { ContactInfo } from './components/contact-info'
import { ContactPromises } from './components/contact-promises'
import { ContactFaq } from './components/contact-faq'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/contact', PAGE_FALLBACKS['/contact'])
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

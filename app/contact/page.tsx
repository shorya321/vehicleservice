import { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { PAGE_FALLBACKS } from '@/lib/cms/page-fallbacks'
import { ContactHero } from './components/contact-hero'
import { ContactForm } from './components/contact-form'
import { ContactInfo } from './components/contact-info'
import { ContactPromises } from './components/contact-promises'
import { ContactFaq } from './components/contact-faq'
import { getContactContent } from '@/lib/cms/server'
import { contactDetailsFrom } from '@/lib/cms/templates/contact/details'
import { getSiteSettings } from '@/lib/site-settings/server'
import { faqPageJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/components/seo/json-ld'

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/contact', PAGE_FALLBACKS['/contact'])
}

export default async function ContactPage() {
  const [content, site] = await Promise.all([getContactContent(), getSiteSettings()])
  const details = contactDetailsFrom(site)
  const faqJsonLd = content.faq.visible ? faqPageJsonLd(content.faq.items) : null

  return (
    <>
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <ContactHero content={content.hero} details={details} />

      <section
        id="contact-form"
        className="editorial-section editorial-section--raised"
      >
        <div className="luxury-container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:items-start">
            <ContactForm />
            <ContactInfo content={content.details} details={details} />
          </div>
        </div>
      </section>

      {content.promises.visible && <ContactPromises content={content.promises} />}

      {content.faq.visible && (
        <section
          aria-labelledby="contact-faq-heading"
          className="editorial-section editorial-section--raised"
        >
          <div className="luxury-container">
            <ContactFaq content={content.faq} />
          </div>
        </section>
      )}
    </>
  )
}

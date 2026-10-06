export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { User } from '@supabase/supabase-js'
import { bookingToday } from "@/lib/utils/timezone"
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PublicHeader } from '@/components/layout/public-header'
import { Hero } from '@/components/home/hero'
import { AfterYouBook } from '@/components/home/after-you-book'
import { DeparturePoints } from '@/components/home/departure-points'
import { Cities } from '@/components/home/cities'
import { TransportationBenefits } from '@/components/home/transportation-benefits'
import { VehicleClasses } from '@/components/home/vehicle-classes'
import { AdditionalServices } from '@/components/home/additional-services'
import { Testimonials } from '@/components/home/testimonials'
import { JoinCommunity } from '@/components/home/join-community'
import { FAQ } from '@/components/home/faq'
import { Footer } from '@/components/layout/footer'
import { getEnabledCurrencies, getFeaturedCurrencies, getDefaultCurrency, getExchangeRatesObject } from '@/lib/currency/server'
import { CURRENCY_COOKIE_NAME } from '@/lib/currency/types'
import { CurrencyProvider } from '@/lib/currency/context'
import { getSiteSettings } from '@/lib/site-settings/server'
import { HEADER_PROFILE_COLUMNS, type HeaderProfile } from '@/components/layout/header-profile'
import type { Metadata } from 'next'
import { getHomeContent } from '@/lib/cms/server'
import { getApprovedReviewCount } from '@/lib/reviews/review-count'
import { buildPageMetadata } from '@/lib/seo/page-metadata'
import { getSeoSettings } from '@/lib/seo/server'
import { faqPageJsonLd, organizationJsonLd, websiteJsonLd, type JsonLdObject } from '@/lib/seo/json-ld'
import { JsonLd } from '@/components/seo/json-ld'

// No fallback title: the home page uses the site default title from Admin > SEO
// as-is, without the brand suffix every other page gets.
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/')
}

export default async function HomePage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const todayStr = bookingToday()

  // Auth and profile run alongside the cached reads: none of them depends on
  // the user, so waiting for getUser first only delays the whole page.
  const loadHeaderUser = async (): Promise<{ user: User | null; profile: HeaderProfile | null }> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null }

    const { data } = await supabase
      .from('profiles')
      .select(HEADER_PROFILE_COLUMNS)
      .eq('id', user.id)
      .single()
    return { user, profile: data }
  }

  const [
    { user, profile },
    featuredCurrencies,
    allEnabledCurrencies,
    defaultCurrency,
    exchangeRates,
    siteSettings,
    { content },
    reviewCount,
    seoSettings,
  ] = await Promise.all([
    loadHeaderUser(),
    getFeaturedCurrencies(),
    getEnabledCurrencies(),
    getDefaultCurrency(),
    getExchangeRatesObject(),
    getSiteSettings(),
    getHomeContent(),
    getApprovedReviewCount(),
    getSeoSettings(),
  ])

  const faqJsonLd = content.faq.visible ? faqPageJsonLd(content.faq.items) : null
  const jsonLd: JsonLdObject[] = [
    organizationJsonLd(siteSettings, seoSettings),
    websiteJsonLd(siteSettings),
    ...(faqJsonLd ? [faqJsonLd] : []),
  ]

  // Get user's currency preference from cookie
  const currencyCookie = cookieStore.get(CURRENCY_COOKIE_NAME)
  const currentCurrency = currencyCookie?.value || defaultCurrency

  return (
    <CurrencyProvider
      initialCurrency={currentCurrency}
      exchangeRates={exchangeRates}
      featuredCurrencies={featuredCurrencies}
      allCurrencies={allEnabledCurrencies}
    >
    <a
        href="#main-content"
        className="skip-nav"
      >
        Skip to main content
      </a>
    {/* Header and footer sit outside <main> so they keep their banner and
        contentinfo landmarks, and the skip link lands past the navigation. */}
    <div className="bg-[var(--black-void)]">
      <PublicHeader
        initialUser={user}
        initialProfile={profile}
        siteSettings={siteSettings}
      />
    <main id="main-content" tabIndex={-1} className="outline-none">
      <JsonLd data={jsonLd} />
      <Hero
        todayDate={todayStr}
        tripSettings={siteSettings.trip_types}
        content={content.hero}
        hasReviews={reviewCount > 0}
      />
      {content.after_you_book.visible && <AfterYouBook content={content.after_you_book} />}
      {/* empty:hidden: DeparturePoints renders nothing when no route is
          popular, and the wrapper's top border would otherwise draw a stray
          line between the sections either side of it. */}
      {content.routes.visible && (
        <div className="bg-[var(--black-rich)] border-t border-[var(--graphite)] empty:hidden">
          <DeparturePoints todayDate={todayStr} content={content.routes} />
        </div>
      )}
      {content.cities.visible && (
        <div className="bg-[var(--black-rich)]">
          <Cities content={content.cities} />
        </div>
      )}
      {content.benefits.visible && (
        <div className="bg-[var(--black-void)]">
          <TransportationBenefits content={content.benefits} />
        </div>
      )}
      {content.fleet.visible && (
        <div className="bg-[var(--black-rich)] border-t border-[var(--graphite)]">
          <VehicleClasses content={content.fleet} />
        </div>
      )}
      {content.onboard.visible && (
        <div className="bg-[var(--black-void)]" id="services">
          <AdditionalServices content={content.onboard} />
        </div>
      )}
      {/* Testimonials reads uncached review data far below the fold, so it
          streams in rather than holding back the hero's HTML. */}
      {content.testimonials.visible && (
        <div className="border-t border-[var(--graphite)]">
          <Suspense fallback={null}>
            <Testimonials content={content.testimonials} />
          </Suspense>
        </div>
      )}
      {content.account.visible && <JoinCommunity content={content.account} />}
      {content.faq.visible && <FAQ content={content.faq} />}
    </main>
      <Footer siteSettings={siteSettings} />
    </div>
    </CurrencyProvider>
  )
}

import { WorkingSearchWidget } from '@/components/search/working-search-widget'
import { PopularRoutes } from '@/components/search/popular-routes'
import { getPopularRoutes } from './actions'
import { ArrowRight, Shield, Clock, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/public-layout'

export const metadata = {
  title: 'Book Reliable Transfers | Airport, Port & City Transfers',
  description: 'Book comfortable and reliable transfers to airports, ports, and cities. Professional drivers, fixed prices, and 24/7 support.',
}

export default async function HomePage() {
  let popularRoutes = []
  try {
    popularRoutes = await getPopularRoutes()
  } catch (error) {
    console.error('Error fetching popular routes:', error)
    // Continue with empty array
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Book Reliable Transfers<br />
              <span className="text-primary">Anywhere, Anytime</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional drivers, comfortable vehicles, and fixed prices for airport, port, and city transfers.
            </p>
          </div>

          {/* Search Widget */}
          <div className="mt-12 max-w-5xl mx-auto">
            <WorkingSearchWidget />
          </div>

          {/* Trust Badges */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Safe & Reliable</div>
                <div className="text-sm text-muted-foreground">Verified drivers & vehicles</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div className="text-left">
                <div className="font-semibold">24/7 Service</div>
                <div className="text-sm text-muted-foreground">Available round the clock</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Fixed Prices</div>
                <div className="text-sm text-muted-foreground">No hidden charges</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="container mx-auto px-4 py-16">
        <PopularRoutes routes={popularRoutes} />
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold">Search & Select</h3>
              <p className="text-muted-foreground">
                Enter your pickup and drop-off locations to find available routes and vehicles
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold">Choose Vehicle</h3>
              <p className="text-muted-foreground">
                Select from a range of vehicles that suit your needs and budget
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold">Book & Travel</h3>
              <p className="text-muted-foreground">
                Complete your booking and receive instant confirmation with all details
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Book Your Transfer?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their transfer needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-md bg-background text-primary px-6 py-3 font-semibold hover:bg-background/90 transition"
            >
              Start Booking
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-md border-2 border-primary-foreground text-primary-foreground px-6 py-3 font-semibold hover:bg-primary-foreground/10 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

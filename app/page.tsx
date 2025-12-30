import { PublicHeader } from '@/components/layout/public-header'
import { Hero } from '@/components/home/hero'
import { DeparturePoints } from '@/components/home/departure-points'
import { TransportationBenefits } from '@/components/home/transportation-benefits'
import { VehicleClasses } from '@/components/home/vehicle-classes'
import { AdditionalServices } from '@/components/home/additional-services'
import { Testimonials } from '@/components/home/testimonials'
import { JoinCommunity } from '@/components/home/join-community'
import { FAQ } from '@/components/home/faq'
import { Footer } from '@/components/layout/footer'

export const metadata = {
  title: 'VehicleService - Premier Luxury Transportation',
  description: 'Experience unparalleled luxury, comfort, and reliability with our premier transfer services.',
}

export default function HomePage() {
  return (
    <main className="bg-luxury-black">
      <PublicHeader />
      <Hero />
      <div className="bg-luxury-darkGray">
        <DeparturePoints />
      </div>
      <div className="bg-luxury-black">
        <TransportationBenefits />
      </div>
      <div className="bg-luxury-darkGray" id="fleet">
        <VehicleClasses />
      </div>
      <div className="bg-luxury-black" id="services">
        <AdditionalServices />
      </div>
      <div className="bg-luxury-darkGray">
        <Testimonials />
      </div>
            <div className="bg-luxury-darkGray">
        <JoinCommunity />
      </div>
      <div className="bg-luxury-black" id="faq">
        <FAQ />
      </div>
      <Footer />
    </main>
  )
}

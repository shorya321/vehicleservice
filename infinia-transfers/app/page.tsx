import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { DeparturePoints } from "@/components/departure-points"
import { TransportationBenefits } from "@/components/transportation-benefits"
import { CarClasses } from "@/components/car-classes"
import { AdditionalServices } from "@/components/additional-services"
import { Testimonials } from "@/components/testimonials"
import { OurPartners } from "@/components/our-partners"
import { JoinCommunity } from "@/components/join-community"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="bg-luxury-black">
      <Header />
      <Hero />
      <div className="bg-luxury-darkGray">
        <DeparturePoints />
      </div>
      <div className="bg-luxury-black">
        <TransportationBenefits />
      </div>
      <div className="bg-luxury-darkGray">
        <CarClasses />
      </div>
      <div className="bg-luxury-black">
        <AdditionalServices />
      </div>
      <div className="bg-luxury-darkGray">
        <Testimonials />
      </div>
      <div className="bg-luxury-black">
        <OurPartners />
      </div>
      <div className="bg-luxury-darkGray">
        <JoinCommunity />
      </div>
      <div className="bg-luxury-black">
        <FAQ />
      </div>
      <Footer />
    </main>
  )
}

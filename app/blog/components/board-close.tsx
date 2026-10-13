import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

/** Closing panel: from reading to booking. */
export function BoardClose() {
  return (
    <section aria-labelledby="blog-close-heading" className="luxury-container blog-board-close-sec">
      <div className="blog-board-bezel blog-board-close">
        <div className="blog-board-core blog-board-close__core">
          <div>
            <p className="blog-board-eyebrow">
              <i aria-hidden="true" />
              Done reading?
            </p>
            <h2 id="blog-close-heading" className="blog-board-close__title">Know the road. Now ride it.</h2>
            <p className="blog-board-close__body">
              Pick a route, choose a vehicle, and the fare is fixed at booking. Your chauffeur
              tracks the flight, so a late landing costs nothing.
            </p>
            <div className="blog-board-close__acts">
              <Link href="/" className="blog-board-btn">
                Find your transfer
                <span className="blog-board-btn__ic" aria-hidden="true"><ArrowUpRight className="h-4 w-4" strokeWidth={1.5} /></span>
              </Link>
              <Link href="/#fleet" className="blog-board-btn blog-board-btn--ghost">
                See the fleet
                <span className="blog-board-btn__ic" aria-hidden="true"><ArrowUpRight className="h-4 w-4" strokeWidth={1.5} /></span>
              </Link>
            </div>
            <p className="blog-board-trust">
              <span>Fixed price at booking</span>
              <span>Flight tracked</span>
              <span>Free cancellation</span>
            </p>
          </div>
          {/* unoptimized: /benefits is outside the maintenance-exempt paths (see home Cities). */}
          <div className="blog-board-close__photos" aria-hidden="true">
            <Image src="/benefits/relaxed-safe-ride.jpg" alt="" width={480} height={600} unoptimized />
            <Image src="/benefits/easy-booking-process.jpg" alt="" width={480} height={600} unoptimized />
          </div>
        </div>
      </div>
    </section>
  )
}

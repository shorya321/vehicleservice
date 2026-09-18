import { RouteConnector } from "@/app/search/results/components/route-connector"

/**
 * What happens once the form goes in, drawn as the checkout stub the rest of the funnel
 * uses: a cap, the perforation, and the route connector between two stops. It sits
 * under the rail's index, where the sticky column otherwise ran out ~900px before the
 * form did.
 *
 * Desktop only, like the index above it. On a phone the docked submit bar already
 * carries the 48-hour promise.
 */
export function AfterSubmit({ className = "" }: { className?: string }) {
  return (
    <section className={`checkout-summary-card ${className}`} aria-labelledby="vendor-after-submit-heading">
      <div className="checkout-stub-cap">
        <h2 id="vendor-after-submit-heading" className="checkout-stub-ref">
          After you submit
        </h2>
        <span className="checkout-stub-ref">Within 48 hours</span>
      </div>
      <div className="checkout-stub-perf" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="px-6 pb-6 pt-2">
        <p className="checkout-stub-route">
          <span className="checkout-stub-route__place">
            <span className="checkout-stub-route__name">You apply</span>
            <span className="checkout-stub-route__note">Today</span>
          </span>
          <RouteConnector />
          <span className="checkout-stub-route__place">
            <span className="checkout-stub-route__name">We reply</span>
            <span className="checkout-stub-route__note">By email, either way</span>
          </span>
        </p>
        <p className="checkout-stub-facts">
          <span>
            Approved? Add bank details and your fleet from the <strong>vendor dashboard</strong>.
          </span>
        </p>
      </div>
    </section>
  )
}

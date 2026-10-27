import Image from 'next/image'
import Link from 'next/link'
import type { TripType } from '@/lib/trips/types'
import type { CheckoutBookingSummary, SummaryStop } from '../booking-summary'

const TRIP_LABEL: Record<TripType, string> = {
  one_way: 'One way',
  round_trip: 'Round trip',
  multi_city: 'Multi-city',
  hourly: 'Hourly',
}

interface CheckoutTicketProps {
  summary: CheckoutBookingSummary
  /** Short form for the mobile column: route, date, time, car. */
  compact?: boolean
}

function hasRoute(summary: CheckoutBookingSummary): boolean {
  return Boolean(summary.from || summary.to)
}

/** True when there is anything at all worth putting on the ticket. */
export function hasTicketContent(summary: CheckoutBookingSummary): boolean {
  return hasRoute(summary) || Boolean(summary.dateLabel || summary.time || summary.vehicle || summary.passengers)
}

function Stop({ stop, to }: { stop: SummaryStop; to?: boolean }): React.JSX.Element {
  return (
    <div className="ckt-stop">
      <span className={to ? 'ckt-dot ckt-dot--to' : 'ckt-dot'} aria-hidden="true" />
      <div className="min-w-0">
        <p className="ckt-stop-name">{stop.name}</p>
        {stop.city && <p className="ckt-stop-city">{stop.city}</p>}
      </div>
    </div>
  )
}

function Route({ summary }: { summary: CheckoutBookingSummary }): React.JSX.Element | null {
  if (!hasRoute(summary)) return null
  return (
    <div className="ckt-route">
      {summary.from && <Stop stop={summary.from} />}
      {summary.from && summary.to && <span className="ckt-line" aria-hidden="true" />}
      {summary.to && <Stop stop={summary.to} to />}
    </div>
  )
}

/**
 * The booking the traveller is signing in to finish, drawn as a route stub
 * like the home page route cards. Server component: no state, so both the
 * full and compact forms can render and CSS picks one per breakpoint.
 */
export function CheckoutTicket({ summary, compact = false }: CheckoutTicketProps): React.JSX.Element | null {
  if (!hasTicketContent(summary)) return null
  const { vehicle } = summary

  if (compact) {
    const when = [summary.dateLabel, summary.time].filter(Boolean).join(' · ')
    const what = [vehicle?.name, summary.passengers ? `${summary.passengers} passenger${summary.passengers === 1 ? '' : 's'}` : null]
      .filter(Boolean)
      .join(' · ')
    return (
      <div className="ckt ckt--compact" aria-label="Your transfer">
        {hasRoute(summary) && <div className="ckt-body"><Route summary={summary} /></div>}
        {(when || what) && (
          <>
            {hasRoute(summary) && <div className="ckt-tear" aria-hidden="true" />}
            <p className="ckt-meta">
              {when && <span>{when}</span>}
              {what && <span>{what}</span>}
            </p>
          </>
        )}
      </div>
    )
  }

  const facts = [
    summary.dateLabel ? { label: 'Date', value: summary.dateLabel, numeric: false } : null,
    summary.time ? { label: 'Pickup', value: summary.time, numeric: true } : null,
    summary.passengers ? { label: 'Passengers', value: String(summary.passengers), numeric: true } : null,
  ].filter((fact): fact is { label: string; value: string; numeric: boolean } => fact !== null)

  return (
    <section className="ckt" aria-label="Your transfer">
      <div className="ckt-head">
        <span>Your transfer</span>
        <Link href="/" className="cauth-link">Edit search</Link>
      </div>

      {hasRoute(summary) && (
        <div className="ckt-body">
          <Route summary={summary} />
          {(summary.distanceKm != null || summary.durationMinutes != null) && (
            <p className="ckt-nums">
              {summary.distanceKm != null && <span><strong>{summary.distanceKm}</strong><small>km</small></span>}
              {summary.distanceKm != null && summary.durationMinutes != null && <i aria-hidden="true" />}
              {summary.durationMinutes != null && <span><strong>{summary.durationMinutes}</strong><small>min</small></span>}
              <i aria-hidden="true" />
              <span className="ckt-trip">{TRIP_LABEL[summary.trip]}</span>
            </p>
          )}
        </div>
      )}

      {facts.length > 0 && (
        <>
          {hasRoute(summary) && <div className="ckt-tear" aria-hidden="true" />}
          <dl className="ckt-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd className={fact.numeric ? 'ckt-num' : undefined}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {vehicle && (
        <div className="ckt-car">
          {vehicle.imageUrl && (
            <Image src={vehicle.imageUrl} alt="" width={96} height={54} className="ckt-car-img" />
          )}
          <div className="min-w-0">
            <p className="ckt-car-name">{vehicle.name}</p>
            <p className="ckt-car-spec">
              {[
                vehicle.category,
                vehicle.seats ? `${vehicle.seats} seat${vehicle.seats === 1 ? '' : 's'}` : null,
                vehicle.bags ? `${vehicle.bags} bag${vehicle.bags === 1 ? '' : 's'}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

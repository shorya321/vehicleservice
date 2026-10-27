import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { HeroMap } from '@/components/home/hero/hero-map'
import type { TripType } from '@/lib/trips/types'
import type { CheckoutBookingSummary, SummaryStop } from '../booking-summary'
import { CHECKOUT_TRUST } from './checkout-trust'

const TRIP_LABEL: Record<TripType, string> = {
  one_way: 'One way',
  round_trip: 'Round trip',
  multi_city: 'Multi-city',
  hourly: 'Hourly',
}


interface CheckoutTicketProps {
  summary: CheckoutBookingSummary
}

function hasRoute(summary: CheckoutBookingSummary): boolean {
  return Boolean(summary.from || summary.to)
}

/** True when there is anything at all worth putting on the ticket. */
export function hasTicketContent(summary: CheckoutBookingSummary): boolean {
  return hasRoute(summary) || Boolean(summary.dateLabel || summary.time || summary.vehicle || summary.passengers)
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
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

/** A dotted route over the home map, drawn between two pins. Decorative. */
function TicketMap(): React.JSX.Element {
  return (
    <div className="ckt-map" aria-hidden="true">
      <HeroMap centreFade={false} />
      <svg className="ckt-map-route" viewBox="0 0 368 128" preserveAspectRatio="xMidYMid slice">
        <path d="M58 92 C 120 70, 170 96, 220 66 S 290 40, 312 38" />
        <circle className="ckt-map-halo" cx="58" cy="92" r="10" />
        <circle cx="58" cy="92" r="4" />
        <circle className="ckt-map-halo" cx="312" cy="38" r="10" />
        <circle cx="312" cy="38" r="4" />
      </svg>
    </div>
  )
}

function Facts({ summary }: CheckoutTicketProps): React.JSX.Element | null {
  const facts = [
    summary.dateLabel ? { label: 'Date', value: summary.dateLabel } : null,
    summary.time ? { label: 'Pickup', value: summary.time } : null,
    summary.passengers ? { label: 'Guests', value: String(summary.passengers) } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null)

  if (facts.length === 0) return null
  return (
    <dl className="ckt-facts">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Vehicle({ summary }: CheckoutTicketProps): React.JSX.Element | null {
  const { vehicle } = summary
  if (!vehicle) return null
  const spec = [
    vehicle.category,
    vehicle.seats ? plural(vehicle.seats, 'seat') : null,
    vehicle.bags ? plural(vehicle.bags, 'bag') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="ckt-car">
      {vehicle.imageUrl && (
        <Image src={vehicle.imageUrl} alt="" width={96} height={54} className="ckt-car-img" />
      )}
      <div className="min-w-0">
        <p className="ckt-car-name">{vehicle.name}</p>
        {spec && <p className="ckt-car-spec">{spec}</p>}
      </div>
    </div>
  )
}

function Trust(): React.JSX.Element {
  return (
    <ul className="ckt-trust">
      {CHECKOUT_TRUST.map((item) => (
        <li key={item}>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  )
}

/**
 * The booking the traveller is signing in to finish, as a sidebar card like
 * the checkout page's own summary. Server component, no state.
 */
export function CheckoutTicket({ summary }: CheckoutTicketProps): React.JSX.Element | null {
  if (!hasTicketContent(summary)) return null
  const head = [
    TRIP_LABEL[summary.trip],
    summary.distanceKm != null ? `${summary.distanceKm} km` : null,
    summary.durationMinutes != null ? `${summary.durationMinutes} min` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="ckt" aria-label="Your transfer">
      {hasRoute(summary) && <TicketMap />}
      <div className="ckt-head">
        <span>{head}</span>
        <Link href="/" className="cauth-link">Edit search</Link>
      </div>
      {hasRoute(summary) && (
        <div className="ckt-route">
          {summary.from && <Stop stop={summary.from} />}
          {summary.from && summary.to && <span className="ckt-line" aria-hidden="true" />}
          {summary.to && <Stop stop={summary.to} to />}
        </div>
      )}
      <Facts summary={summary} />
      <Vehicle summary={summary} />
      <Trust />
    </section>
  )
}

/**
 * The same booking folded into one line for narrow screens, opening for the
 * date, car and promises. A native disclosure, so it needs no client JS.
 */
export function CheckoutTripLine({ summary }: CheckoutTicketProps): React.JSX.Element | null {
  if (!hasTicketContent(summary)) return null
  const meta = [
    summary.dateLabel,
    summary.time,
    summary.vehicle?.name,
    summary.passengers ? plural(summary.passengers, 'guest') : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <details className="cktl">
      <summary>
        <div className="min-w-0">
          {hasRoute(summary) && (
            <p className="cktl-route">
              {summary.from && <span>{summary.from.name}</span>}
              {summary.from && summary.to && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
              {summary.to && <span>{summary.to.name}</span>}
            </p>
          )}
          {meta && <p className="cktl-meta">{meta}</p>}
        </div>
        <span className="cktl-more">
          Details
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </summary>
      <div className="cktl-body">
        <Facts summary={summary} />
        <Vehicle summary={summary} />
        <Trust />
      </div>
    </details>
  )
}

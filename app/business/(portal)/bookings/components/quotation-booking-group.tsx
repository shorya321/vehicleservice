'use client';

/**
 * Quotation Booking Group
 * One list entry for every booking converted from the same quotation. The header
 * sums the trips; expanding it shows each trip as its normal row.
 *
 * SCOPE: Business module ONLY
 */

import { useState, type ReactNode } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { formatBookingDate } from '@/lib/business/utils/timezone';

interface GroupBooking {
  id: string;
  pickup_datetime: string;
  booking_status: string;
  total_price: number;
  customer_name: string;
  from_locations: { name: string; city: string } | null;
  to_locations: { name: string; city: string } | null;
}

interface QuotationBookingGroupProps<T extends GroupBooking> {
  variant: 'table' | 'card';
  quotationNumber: string | null;
  bookings: T[];
  totalTrips: number;
  /** The status badge the list already uses, so a group reads like its rows. */
  renderStatus: (bookingStatus: string) => ReactNode;
  /** Renders one trip as the list's normal row or card. */
  renderBooking: (booking: T, index: number) => ReactNode;
  /**
   * Overrides for a round trip or multi-city trip, which reuses this row. Absent for a
   * quotation group, which renders exactly as before.
   */
  trip?: {
    title: string;
    icon: ReactNode;
    countLabel: string;
    /** A round trip's far end, so the header reads A to B rather than A to A. */
    routeTo?: string;
  };
}

const DATE_PATTERN = 'MMM d, yyyy';

function summarise<T extends GroupBooking>(bookings: T[], totalTrips: number) {
  const first = bookings[0];
  const last = bookings[bookings.length - 1];
  const firstDate = formatBookingDate(first.pickup_datetime, DATE_PATTERN);
  const lastDate = formatBookingDate(last.pickup_datetime, DATE_PATTERN);
  const guests = new Set(bookings.map((b) => b.customer_name));
  const statuses = new Set(bookings.map((b) => b.booking_status));

  return {
    firstDate,
    lastDate: lastDate === firstDate ? null : lastDate,
    guest: guests.size === 1 ? first.customer_name : `${guests.size} guests`,
    from: first.from_locations?.name || 'N/A',
    to: last.to_locations?.name || 'N/A',
    sharedStatus: statuses.size === 1 ? first.booking_status : null,
    total: bookings.reduce((sum, b) => sum + Number(b.total_price), 0),
    tripsLabel:
      bookings.length === totalTrips
        ? `${totalTrips} trips`
        : `${bookings.length} of ${totalTrips} trips shown`,
  };
}

function MixedBadge() {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      Mixed
    </span>
  );
}

export function QuotationBookingGroup<T extends GroupBooking>({
  variant,
  quotationNumber,
  bookings,
  totalTrips,
  renderStatus,
  renderBooking,
  trip,
}: QuotationBookingGroupProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const summary = summarise(bookings, totalTrips);
  const s = trip
    ? { ...summary, tripsLabel: trip.countLabel, to: trip.routeTo ?? summary.to }
    : summary;
  const title = trip ? trip.title : quotationNumber ? `Quotation ${quotationNumber}` : 'Quotation';
  const icon = trip ? trip.icon : <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
  const toggleLabel = `${expanded ? 'Hide' : 'Show'} ${bookings.length} bookings from ${title}`;
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const toggle = () => setExpanded((v) => !v);

  // The whole header is clickable for the mouse; this button is the keyboard and
  // screen-reader control, so it stops the click from toggling twice.
  const toggleButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      aria-expanded={expanded}
      aria-label={toggleLabel}
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Chevron className="h-4 w-4" />
    </button>
  );

  const panel = (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      inert={!expanded}
      aria-hidden={!expanded}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            'border-l-2 border-primary/40',
            variant === 'table' ? 'ml-5 divide-y divide-border' : 'ml-3 mt-2 space-y-3 pl-3'
          )}
        >
          {bookings.map((booking, index) => renderBooking(booking, index))}
        </div>
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <div>
        <div
          onClick={toggle}
          className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {toggleButton}
              {icon}
              <span className="break-words text-sm font-semibold text-foreground">{title}</span>
            </div>
            {s.sharedStatus ? renderStatus(s.sharedStatus) : <MixedBadge />}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {s.tripsLabel} · {s.guest}
          </p>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{s.from}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0 text-primary/50" />
            <span className="truncate">{s.to}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {s.firstDate}
              {s.lastDate && ` to ${s.lastDate}`}
            </span>
            <span className="text-sm font-bold text-primary">{formatCurrency(s.total)}</span>
          </div>
        </div>
        {panel}
      </div>
    );
  }

  return (
    <div className={cn(expanded && 'bg-primary/[0.03]')}>
      <div
        onClick={toggle}
        className="grid cursor-pointer grid-cols-[40px,1fr,1fr,1.5fr,100px,100px,80px] items-center border-l-2 border-transparent px-5 py-4 transition-all duration-150 hover:border-l-primary hover:bg-muted/50"
      >
        <span className="flex items-center justify-center">{toggleButton}</span>
        <span className="block">
          <span className="block text-sm font-medium text-foreground">{s.firstDate}</span>
          {s.lastDate && <span className="block text-xs text-muted-foreground">to {s.lastDate}</span>}
        </span>
        <span className="block min-w-0">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {icon}
            <span className="truncate">{title}</span>
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {s.tripsLabel} · {s.guest}
          </span>
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="max-w-[120px] truncate">{s.from}</span>
          <ArrowRight className="h-3 w-3 flex-shrink-0 text-primary/50" />
          <span className="max-w-[120px] truncate">{s.to}</span>
        </span>
        {s.sharedStatus ? renderStatus(s.sharedStatus) : <MixedBadge />}
        <span className="text-right text-sm font-bold text-primary">{formatCurrency(s.total)}</span>
        <span />
      </div>
      {panel}
    </div>
  );
}

/**
 * How a stored business booking describes its trip, for every business surface that shows one:
 * list, detail, dashboard, emails. Inputs are raw `business_bookings` columns.
 * SCOPE: Business module ONLY. Business twin of lib/trips/display.ts. Do not de-duplicate.
 */
import { BUSINESS_HOURLY_PACKAGE_LABELS, BUSINESS_TRIP_TYPE_LABELS } from './constants';
import { isBusinessHourlyPackage, isBusinessTripType, type BusinessTripType } from './types';

export interface BusinessTripColumns {
  trip_type?: string | null;
  hourly_package?: string | null;
  duration_hours?: number | null;
  included_km?: number | null;
  leg_index?: number | null;
}

export function businessTripTypeOf(row: BusinessTripColumns): BusinessTripType {
  return isBusinessTripType(row.trip_type) ? row.trip_type : 'one_way';
}

export function businessTripTypeLabel(row: BusinessTripColumns): string {
  return BUSINESS_TRIP_TYPE_LABELS[businessTripTypeOf(row)];
}

export function isBusinessHourlyBooking(row: BusinessTripColumns): boolean {
  return businessTripTypeOf(row) === 'hourly';
}

/** "Half day, 5 hours". Null for anything that is not hourly. */
export function businessHourlyPackageLabel(row: BusinessTripColumns): string | null {
  if (!isBusinessHourlyBooking(row)) return null;
  const pkg = isBusinessHourlyPackage(row.hourly_package)
    ? BUSINESS_HOURLY_PACKAGE_LABELS[row.hourly_package]
    : 'Hourly';
  const hours = row.duration_hours ? Number(row.duration_hours) : null;
  return hours ? `${pkg}, ${hours} hours` : pkg;
}

/** "Half day · 5 h · 100 km included". Null for anything that is not hourly. */
export function businessHourlySummary(row: BusinessTripColumns): string | null {
  if (!isBusinessHourlyBooking(row)) return null;
  const parts = [
    isBusinessHourlyPackage(row.hourly_package) ? BUSINESS_HOURLY_PACKAGE_LABELS[row.hourly_package] : 'Hourly',
    row.duration_hours ? `${Number(row.duration_hours)} h` : null,
    row.included_km ? `${row.included_km} km included` : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

/** "Outbound" / "Return" for a round trip, "Journey 2 of 3" for multi-city, null otherwise. */
export function businessLegLabel(row: BusinessTripColumns, legCount?: number | null): string | null {
  const type = businessTripTypeOf(row);
  if (row.leg_index === null || row.leg_index === undefined) return null;
  if (type === 'round_trip') return row.leg_index === 0 ? 'Outbound' : 'Return';
  if (type === 'multi_city') {
    return legCount ? `Journey ${row.leg_index + 1} of ${legCount}` : `Journey ${row.leg_index + 1}`;
  }
  return null;
}

/** The "to" side of a route line: the destination, or "Hourly · 5 h". */
export function businessDestinationLabel(
  row: BusinessTripColumns & { dropoff_address?: string | null },
  destinationName?: string | null
): string {
  if (isBusinessHourlyBooking(row)) {
    return row.duration_hours ? `Hourly · ${Number(row.duration_hours)} h` : 'Hourly';
  }
  return destinationName || row.dropoff_address || '';
}

/** "A → B" for a transfer, "A · Hourly · 5 h" for an hourly hire. */
export function businessRouteLabel(
  row: BusinessTripColumns & { dropoff_address?: string | null },
  fromName: string | null | undefined,
  toName: string | null | undefined
): string {
  const from = fromName || 'Unknown';
  if (isBusinessHourlyBooking(row)) return `${from} · ${businessDestinationLabel(row)}`;
  return `${from} → ${businessDestinationLabel(row, toName) || 'Unknown'}`;
}

/**
 * One line naming which part of a trip this booking is, for per-journey emails and screens.
 * "Round trip BG-20261008-0001, return journey" / "Hourly hire: Half day, 5 hours". Null for one way.
 */
export function businessTripContextLabel(
  row: BusinessTripColumns,
  group?: { group_number?: string | null; leg_count?: number | null } | null
): string | null {
  const type = businessTripTypeOf(row);
  if (type === 'hourly') {
    const parts = [businessHourlyPackageLabel(row), row.included_km ? `${row.included_km} km included` : null];
    return `Hourly hire: ${parts.filter(Boolean).join(', ')}, as directed`;
  }
  if (type === 'one_way') return null;
  const leg = businessLegLabel(row, group?.leg_count)?.toLowerCase() ?? 'journey';
  const ref = group?.group_number ? ` ${group.group_number}` : '';
  return type === 'round_trip' ? `Round trip${ref}, ${leg} journey` : `Multi-city trip${ref}, ${leg}`;
}

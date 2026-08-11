/**
 * Turns an activity row's changes and metadata into the two tables the expanded
 * row renders: a before/after diff and a flat facts list.
 *
 * Pure TypeScript, no React, so the CSV exporter and the copy-to-clipboard
 * button reuse it.
 */

import type { ActivityChanges, ActivityEvent } from './types';
import { formatBookingDateTime } from '@/lib/business/utils/timezone';

export interface DiffRow {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface FactRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Human labels for the field names that appear in changes and metadata.
 * Anything not listed falls back to a de-underscored title case, so a new
 * column shows up readably without a code change.
 */
const FIELD_LABELS: Record<string, string> = {
  business_name: 'Company name',
  business_email: 'Business email',
  business_phone: 'Phone',
  contact_person_name: 'Contact person',
  address: 'Address',
  city: 'City',
  country_code: 'Country',
  brand_name: 'Brand name',
  logo_url: 'Logo',
  theme_config: 'Theme',
  primary_color: 'Primary colour',
  secondary_color: 'Secondary colour',
  accent_color: 'Accent colour',
  custom_domain: 'Custom domain',
  custom_domain_verified: 'Domain verified',
  subdomain: 'Portal address',
  quotation_number_prefix: 'Quotation prefix',
  preferred_currency: 'Display currency',
  payment_element_enabled: 'Card payments',
  save_payment_methods: 'Save cards',
  notification_preferences: 'Wallet alerts',
  low_balance_threshold: 'Low balance alert',
  wallet_frozen: 'Wallet frozen',
  spending_limits_enabled: 'Spending limits',
  max_transaction_amount: 'Per booking limit',
  max_daily_spend: 'Daily limit',
  max_monthly_spend: 'Monthly limit',
  status: 'Status',
  booking_status: 'Booking status',
  pickup_datetime: 'Pickup time',
  previous_datetime: 'Previous pickup time',
  new_datetime: 'New pickup time',
  previous_status: 'Previous status',
  new_status: 'New status',
  balance_before: 'Balance before',
  balance_after: 'Balance after',
  refund_amount: 'Refund',
  refund_issued: 'Refund issued',
  total_amount: 'Total',
  card_brand: 'Card',
  card_last4: 'Card ending',
  vendor_name: 'Vendor',
  member_name: 'Member',
  member_email: 'Member email',
  invited_email: 'Invited email',
  role: 'Role',
  reason_public: 'Reason',
  rows_deleted: 'Entries removed',
  cutoff: 'Cutoff',
  trip_count: 'Trips',
  converted_count: 'Trips converted',
  count: 'Count',
};

/**
 * metadata keys that are plumbing rather than facts. They drive rendering or
 * exist for support correlation, and would be noise in the facts list.
 */
const HIDDEN_METADATA_KEYS = new Set([
  'idempotency_key',
  'batch_id',
  'backfilled',
  'refs',
  'method_clause',
  'pickup_clause',
  'client_clause',
  'refund_summary',
  'cutoff_label',
  'period_label',
  'role_label',
  'email_masked',
]);

export function fieldLabel(field: string): string {
  if (FIELD_LABELS[field]) return FIELD_LABELS[field];
  const words = field.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Format a single stored value for display.
 *
 * Booleans become Yes/No rather than true/false, nulls become an em-free
 * placeholder, and objects are summarised rather than dumped, because a raw
 * JSON blob in an owner-facing panel is exactly the failure this design avoids.
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === 'string') {
    // ISO timestamps read badly raw.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return formatBookingDateTime(parsed, "d MMM yyyy 'at' HH:mm");
      }
    }
    return value;
  }
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    return keys.length ? `${keys.length} fields` : 'Not set';
  }
  return String(value);
}

/** Build the before/after table. Returns an empty array when nothing changed. */
export function buildDiffRows(changes: ActivityChanges | null | undefined): DiffRow[] {
  if (!changes) return [];
  return Object.entries(changes)
    .filter(([, change]) => change && typeof change === 'object')
    .map(([field, change]) => ({
      field,
      label: fieldLabel(field),
      before: formatValue(change.from),
      after: formatValue(change.to),
    }));
}

/** Build the flat facts list from metadata plus the promoted money columns. */
export function buildFactRows(event: ActivityEvent): FactRow[] {
  const rows: FactRow[] = [];

  if (event.amount !== null) {
    rows.push({
      key: 'amount',
      label: 'Amount',
      value: `${event.currency ?? ''} ${formatValue(event.amount)}`.trim(),
    });
  }

  const metadata = event.metadata ?? {};
  for (const [key, value] of Object.entries(metadata)) {
    if (HIDDEN_METADATA_KEYS.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'object' && !Array.isArray(value)) continue;
    rows.push({ key, label: fieldLabel(key), value: formatValue(value) });
  }

  return rows;
}

/**
 * References carried by bulk rows, e.g. the booking numbers behind a single
 * booking.bulk_deleted entry. Capped so one row cannot render a thousand lines.
 */
export function buildReferenceList(
  event: ActivityEvent,
  limit = 20
): { refs: string[]; remaining: number } {
  const raw = event.metadata?.refs;
  if (!Array.isArray(raw)) return { refs: [], remaining: 0 };
  const all = raw.filter((entry): entry is string => typeof entry === 'string');
  return { refs: all.slice(0, limit), remaining: Math.max(0, all.length - limit) };
}

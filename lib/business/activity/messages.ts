/**
 * Renders an activity row into a human sentence.
 *
 * Pure TypeScript, no React import, so the row component maps segments to
 * elements while the CSV exporter flattens the same segments to plain text.
 *
 * Why render at read time instead of storing a pre-rendered sentence:
 *   - Copy changes. A stored string freezes the first draft and makes the same
 *     event read two different ways depending on the month it happened.
 *   - Amounts are converted into the owner's preferred currency at render time
 *     (see transactions-list.tsx). A frozen "AED 1,200" would contradict the
 *     wallet page on the same screen.
 *   - The sentence contains a bold actor and an inline link. A stored plain
 *     string would have to be re-parsed to inject them.
 *
 * The usual objection to read-time rendering is entity renames and deletions.
 * The answer is not to store the sentence, it is to snapshot every noun into
 * the row at write time (actor_name, entity_label, amount, and every from/to
 * inside changes). This renderer therefore reads only its own row and never
 * joins a live table for display text.
 */

import type { ActivityEvent, MessageSegment } from './types';

/**
 * Templates. Placeholders in {braces}.
 *
 * {actor} and {entity} become their own segment kinds. {amount} is formatted
 * through the injected money formatter. Everything else resolves from metadata,
 * then from the top-level row.
 *
 * A placeholder that cannot be resolved is dropped and the surrounding
 * punctuation is tidied, so an optional trailing clause simply disappears
 * rather than rendering as literal "{reason_public}".
 */
const TEMPLATES: Record<string, string> = {
  // Wallet
  'wallet.topup_initiated': '{actor} started a {amount} top up{method_clause}',
  'wallet.topup_succeeded': 'Top up of {amount} completed. Balance is now {balance_after}',
  'wallet.topup_failed': 'Top up of {amount} failed. {reason_public}',
  'wallet.debited': '{amount} was deducted for booking {entity}',
  'wallet.payment_rejected': 'Booking could not be paid. {reason_public}',
  'wallet.refunded': '{amount} was refunded for cancelled booking {entity}',
  'wallet.credited_by_admin': 'Platform admin added {amount} to your wallet. {reason_public}',
  'wallet.debited_by_admin': 'Platform admin deducted {amount} from your wallet. {reason_public}',
  'wallet.frozen': 'Platform admin froze your wallet. New bookings cannot be paid until it is unfrozen. {reason_public}',
  'wallet.unfrozen': 'Platform admin unfroze your wallet. {reason_public}',
  'wallet.spending_limit_set': 'Platform admin set spending limits on your wallet',
  'wallet.spending_limit_removed': 'Platform admin removed your spending limits',
  'wallet.low_balance_alert': 'Balance dropped below {threshold}. Current balance is {balance}',
  'wallet.payment_method_added': '{actor} saved a {card_brand} card ending {card_last4}',
  'wallet.payment_method_removed': '{actor} removed the {card_brand} card ending {card_last4}',
  'wallet.payment_method_default_changed': '{actor} made the {card_brand} card ending {card_last4} the default',

  // Bookings
  'booking.created': '{actor} created booking {entity}{pickup_clause}',
  'booking.created_from_quotation': '{actor} converted quotation {quotation_number} into booking {entity}',
  'booking.datetime_changed': '{actor} moved booking {entity} from {previous_datetime} to {new_datetime}',
  'booking.cancelled': '{actor} cancelled booking {entity}. {refund_summary}',
  'booking.cancelled_by_admin': 'Platform admin cancelled booking {entity}. No refund was issued',
  'booking.deleted': '{actor} deleted booking {entity}. No refund was issued',
  'booking.bulk_deleted': '{actor} deleted {count} bookings. No refunds were issued',
  'booking.status_changed_by_admin': 'Platform admin changed booking {entity} from {previous_status} to {new_status}',
  'booking.assigned_to_vendor': 'Booking {entity} was assigned to {vendor_name}',
  'booking.accepted_by_vendor': '{vendor_name} accepted booking {entity}',
  'booking.rejected_by_vendor': '{vendor_name} declined booking {entity}. {reason_public}',
  'booking.driver_assigned': '{vendor_name} assigned a driver and vehicle to booking {entity}',
  'booking.completed': 'Booking {entity} was marked completed',

  // Quotations
  'quotation.created': '{actor} created quotation {entity}{client_clause}',
  'quotation.updated': '{actor} updated quotation {entity}',
  'quotation.status_changed': '{actor} marked quotation {entity} as {new_status}',
  'quotation.deleted': '{actor} deleted quotation {entity}',
  'quotation.converted': '{actor} converted {converted_count} of {trip_count} trips on quotation {entity} into bookings',

  // Team
  'team.member_invited': '{actor} invited {invited_email} to join as {role_label}',
  'team.member_activated': '{actor} activated {member_name}',
  'team.member_deactivated': '{actor} deactivated {member_name}',
  'team.member_removed': '{actor} permanently removed {member_name}. Their sign in was deleted',

  // Settings
  'settings.company_profile_updated': '{actor} updated the company profile',
  'settings.brand_name_changed': '{actor} changed the brand name',
  'settings.theme_colors_changed': '{actor} updated the portal colours',
  'settings.logo_uploaded': '{actor} uploaded a new logo',
  'settings.logo_removed': '{actor} removed the logo',
  'settings.quotation_prefix_changed': '{actor} changed the quotation number prefix',
  'settings.payment_settings_updated': '{actor} updated payment settings',
  'settings.wallet_alerts_updated': '{actor} updated wallet alert preferences',
  'settings.email_smtp_configured': '{actor} connected {smtp_host} for outgoing email',
  'settings.email_smtp_updated': '{actor} updated the outgoing email settings',
  'settings.email_password_rotated': '{actor} replaced the outgoing email password',
  'settings.email_smtp_enabled': '{actor} switched outgoing email over to {smtp_host}',
  'settings.email_smtp_disabled': '{actor} switched outgoing email back to the platform',
  'settings.email_smtp_removed': '{actor} removed the outgoing email settings',
  'settings.email_test_sent': '{actor} sent a test email to {to_email_masked}',
  'settings.email_test_failed': 'A test email to {to_email_masked} failed. {reason_public}',
  'settings.domain_added': '{actor} added the custom domain {domain}',
  'settings.domain_verified': 'Custom domain {domain} was verified and is now live',
  'settings.domain_verification_failed': 'Verification for {domain} failed. {reason_public}',
  'settings.domain_removed': '{actor} removed the custom domain {domain}',
  'settings.subdomain_changed': '{actor} changed the portal address. Links using the old address will stop working',

  // Security
  'security.login_succeeded': '{actor} signed in',
  'security.login_failed': 'A failed sign in attempt for {email_masked}',
  'security.login_blocked': 'Sign in for {email_masked} was temporarily blocked after repeated failed attempts',
  'security.logout': '{actor} signed out',
  'security.password_changed': '{actor} changed their password. All other sessions were signed out',
  'security.password_reset_requested': 'A password reset was requested for {email_masked}',
  'security.password_reset_completed': '{actor} completed a password reset',
  'security.display_name_changed': '{actor} changed their display name',
  'security.avatar_changed': '{actor} updated their profile picture',

  // Account
  'account.registered': '{actor} created the {business_name} account',
  'account.approved': 'Platform admin approved your account. Your portal is now live',
  'account.rejected': 'Platform admin rejected your account application. {reason_public}',
  'account.suspended': 'Platform admin suspended your account. Bookings and top ups are paused. {reason_public}',
  'account.reactivated': 'Platform admin reactivated your account',
  'activity.purged': '{actor} cleared {rows_deleted} activity entries older than {cutoff_label}',

  // Documents
  'document.statement_generated': '{actor} downloaded the statement for {period_label}',
  'document.transactions_exported': '{actor} exported {count} wallet transactions to CSV',
  'document.activity_exported': '{actor} exported {count} activity entries to CSV',
};

export interface RenderOptions {
  /** Injected so the UI can convert into the owner's preferred currency. */
  formatMoney?: (amount: number, currency: string | null) => string;
  /** Entity ids known to still exist. Anything absent renders struck through. */
  liveEntityIds?: ReadonlySet<string>;
}

function defaultFormatMoney(amount: number, currency: string | null): string {
  const value = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${value}` : value;
}

/** Deep link for the entity a row points at, or null when there is nowhere to go. */
export function entityHref(event: ActivityEvent): string | null {
  if (!event.entityId) return null;
  switch (event.entityType) {
    case 'business_booking':
      return `/business/bookings/${event.entityId}`;
    case 'quotation':
      return `/business/quotations/${event.entityId}`;
    case 'wallet_transaction':
      return `/business/wallet/transactions?highlight=${event.entityId}`;
    case 'business_user':
      return '/business/team';
    case 'domain':
      return '/business/domain';
    case 'payment_method':
      return '/business/wallet';
    default:
      return null;
  }
}

function titleCaseAction(action: string): string {
  const withoutPrefix = action.includes('.') ? action.slice(action.indexOf('.') + 1) : action;
  const words = withoutPrefix.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function stringifyScalar(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // Objects and arrays never belong in a sentence. They are rendered by the
  // detail panel instead. Never fall through to JSON.stringify here: that is
  // what app/admin/users/[id]/activity/page.tsx does and it must not face an owner.
  return null;
}

/**
 * Resolve a placeholder to plain text. Returns null when the value is missing,
 * which causes the placeholder and its surrounding punctuation to be dropped.
 */
function resolvePlaceholder(key: string, event: ActivityEvent): string | null {
  const metadata = event.metadata ?? {};
  if (key in metadata) return stringifyScalar(metadata[key]);

  // A few keys read from promoted columns or from the changes diff.
  switch (key) {
    case 'currency':
      return event.currency;
    case 'entity_label':
      return event.entityLabel;
    default:
      break;
  }

  const changes = event.changes;
  if (changes && key in changes) return stringifyScalar(changes[key].to);

  return null;
}

/** Tidy punctuation left behind when an optional placeholder was dropped. */
function tidy(text: string): string {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,])/g, '$1')
    .replace(/([.,])\1+/g, '$1')
    .replace(/\.\s*$/, '')
    .trim();
}

function pushText(segments: MessageSegment[], value: string): void {
  if (!value) return;
  const last = segments[segments.length - 1];
  if (last && last.kind === 'text') {
    last.value += value;
    return;
  }
  segments.push({ kind: 'text', value });
}

/**
 * Build the sentence for a row.
 *
 * Unknown actions from a newer deploy degrade to a title-cased label rather
 * than blanking the feed or dumping JSON.
 */
export function renderActivityMessage(
  event: ActivityEvent,
  options: RenderOptions = {}
): MessageSegment[] {
  const formatMoney = options.formatMoney ?? defaultFormatMoney;
  const template = TEMPLATES[event.action];

  const segments: MessageSegment[] = [];

  if (!template) {
    if (event.actorType === 'business_user') {
      segments.push({ kind: 'actor', value: event.actorName });
      pushText(segments, ' ');
    }
    pushText(segments, titleCaseAction(event.action));
    if (event.entityLabel) {
      pushText(segments, ' ');
      segments.push(buildEntitySegment(event, options));
    }
    return segments;
  }

  const parts = template.split(/(\{[a-z0-9_]+\})/i);

  for (const part of parts) {
    if (!part) continue;

    if (!part.startsWith('{') || !part.endsWith('}')) {
      pushText(segments, part);
      continue;
    }

    const key = part.slice(1, -1);

    if (key === 'actor') {
      segments.push({ kind: 'actor', value: event.actorName });
      continue;
    }

    if (key === 'entity') {
      segments.push(buildEntitySegment(event, options));
      continue;
    }

    if (key === 'amount') {
      if (event.amount === null) continue;
      segments.push({
        kind: 'amount',
        value: formatMoney(event.amount, event.currency),
      });
      continue;
    }

    const resolved = resolvePlaceholder(key, event);
    if (resolved !== null) pushText(segments, resolved);
  }

  // Tidy each text segment, then drop any that emptied out.
  const tidied = segments
    .map((segment) =>
      segment.kind === 'text' ? { ...segment, value: tidy(segment.value) } : segment
    )
    .filter((segment) => segment.kind !== 'text' || segment.value.length > 0);

  return normalizeSpacing(tidied);
}

function buildEntitySegment(event: ActivityEvent, options: RenderOptions): MessageSegment {
  const label = event.entityLabel ?? 'this item';
  const href = entityHref(event);
  const isDeleted =
    !!event.entityId && !!options.liveEntityIds && !options.liveEntityIds.has(event.entityId);

  return {
    kind: 'entity',
    value: label,
    // A deleted entity renders as struck-through text, never as a dead link.
    href: isDeleted ? undefined : href ?? undefined,
    deleted: isDeleted || undefined,
  };
}

/** Re-insert single spaces between adjacent segments that lost them to tidy(). */
function normalizeSpacing(segments: MessageSegment[]): MessageSegment[] {
  const out: MessageSegment[] = [];
  segments.forEach((segment, index) => {
    if (index > 0) {
      const previous = segments[index - 1];
      const previousEndsWithSpace =
        previous.kind === 'text' && /\s$/.test(previous.value);
      const currentStartsWithSpace =
        segment.kind === 'text' && /^[\s.,]/.test(segment.value);
      if (!previousEndsWithSpace && !currentStartsWithSpace) {
        out.push({ kind: 'text', value: ' ' });
      }
    }
    out.push(segment);
  });
  return out;
}

/** Flatten segments to plain text, for CSV export and copy-to-clipboard. */
export function activityMessageToText(segments: MessageSegment[]): string {
  return segments.map((segment) => segment.value).join('').replace(/\s{2,}/g, ' ').trim();
}

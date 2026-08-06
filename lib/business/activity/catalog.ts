/**
 * The business activity action catalog.
 *
 * Deliberately dependency-free, like lib/business/roles.ts: no Supabase, no
 * next/headers, no React. Client components import this to render labels,
 * icons and filter chips, and the server writer imports it to derive category
 * and severity. One definition, both sides.
 *
 * Category and severity live here rather than at each call site so a caller
 * cannot mis-file wallet.credited_by_admin under "booking". The writer ignores
 * whatever a caller might pass and reads these values instead, which is what
 * makes the UI's category tabs trustworthy.
 *
 * Adding an action here requires no migration: business_activity_logs.action is
 * plain TEXT with no CHECK constraint, on purpose (a constraint violation
 * inside a money function would abort a wallet credit over an audit row).
 */

export type ActivityCategory =
  | 'wallet'
  | 'booking'
  | 'quotation'
  | 'team'
  | 'settings'
  | 'security'
  | 'account'
  | 'document';

/**
 * info      - routine, reversible, high volume. The normal texture of the feed.
 * important - money moved, a customer commitment changed, or configuration that
 *             changes what the outside world sees.
 * critical  - irreversible, a security event, or a unilateral platform action.
 *             Filtering to critical alone must produce a complete list of every
 *             dangerous thing that has ever happened to the account.
 */
export type ActivitySeverity = 'info' | 'important' | 'critical';

export type ActivityActorType =
  | 'business_user'
  | 'admin'
  | 'vendor'
  | 'system'
  | 'customer';

export type ActivityEntityType =
  | 'business_booking'
  | 'quotation'
  | 'wallet'
  | 'wallet_transaction'
  | 'payment_method'
  | 'business_user'
  | 'domain'
  | 'setting'
  | 'account'
  | 'session'
  | 'document';

interface ActivityDefinition {
  category: ActivityCategory;
  severity: ActivitySeverity;
  entityType?: ActivityEntityType;
  /** lucide-react icon name. Resolved to a component in activity-icon.tsx. */
  icon: string;
}

export const BUSINESS_ACTIVITY_ACTIONS = {
  // Wallet -------------------------------------------------------------------
  'wallet.topup_initiated': { category: 'wallet', severity: 'info', entityType: 'wallet', icon: 'CreditCard' },
  'wallet.topup_succeeded': { category: 'wallet', severity: 'important', entityType: 'wallet_transaction', icon: 'ArrowDownCircle' },
  'wallet.topup_failed': { category: 'wallet', severity: 'important', entityType: 'wallet', icon: 'XCircle' },
  'wallet.debited': { category: 'wallet', severity: 'important', entityType: 'wallet_transaction', icon: 'ArrowUpCircle' },
  'wallet.payment_rejected': { category: 'wallet', severity: 'critical', entityType: 'wallet', icon: 'ShieldAlert' },
  'wallet.refunded': { category: 'wallet', severity: 'important', entityType: 'wallet_transaction', icon: 'Undo2' },
  'wallet.credited_by_admin': { category: 'wallet', severity: 'critical', entityType: 'wallet', icon: 'ShieldCheck' },
  'wallet.debited_by_admin': { category: 'wallet', severity: 'critical', entityType: 'wallet', icon: 'ShieldAlert' },
  'wallet.frozen': { category: 'wallet', severity: 'critical', entityType: 'wallet', icon: 'Snowflake' },
  'wallet.unfrozen': { category: 'wallet', severity: 'critical', entityType: 'wallet', icon: 'Sun' },
  'wallet.spending_limit_set': { category: 'wallet', severity: 'important', entityType: 'wallet', icon: 'Gauge' },
  'wallet.spending_limit_removed': { category: 'wallet', severity: 'important', entityType: 'wallet', icon: 'Gauge' },
  'wallet.low_balance_alert': { category: 'wallet', severity: 'important', entityType: 'wallet', icon: 'BellRing' },
  'wallet.payment_method_added': { category: 'wallet', severity: 'important', entityType: 'payment_method', icon: 'CreditCard' },
  'wallet.payment_method_removed': { category: 'wallet', severity: 'important', entityType: 'payment_method', icon: 'CreditCard' },
  'wallet.payment_method_default_changed': { category: 'wallet', severity: 'info', entityType: 'payment_method', icon: 'CreditCard' },

  // Bookings -----------------------------------------------------------------
  'booking.created': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'CalendarPlus' },
  'booking.created_from_quotation': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'CalendarPlus' },
  'booking.datetime_changed': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'CalendarClock' },
  'booking.cancelled': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'CalendarX' },
  'booking.cancelled_by_admin': { category: 'booking', severity: 'critical', entityType: 'business_booking', icon: 'CalendarX' },
  'booking.deleted': { category: 'booking', severity: 'critical', entityType: 'business_booking', icon: 'Trash2' },
  'booking.bulk_deleted': { category: 'booking', severity: 'critical', entityType: 'business_booking', icon: 'Trash2' },
  'booking.status_changed_by_admin': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'RefreshCw' },
  'booking.assigned_to_vendor': { category: 'booking', severity: 'info', entityType: 'business_booking', icon: 'Truck' },
  'booking.accepted_by_vendor': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'CheckCircle2' },
  'booking.rejected_by_vendor': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'XCircle' },
  'booking.driver_assigned': { category: 'booking', severity: 'info', entityType: 'business_booking', icon: 'UserCheck' },
  'booking.completed': { category: 'booking', severity: 'important', entityType: 'business_booking', icon: 'CheckCircle2' },

  // Quotations ---------------------------------------------------------------
  'quotation.created': { category: 'quotation', severity: 'info', entityType: 'quotation', icon: 'FilePlus' },
  'quotation.updated': { category: 'quotation', severity: 'info', entityType: 'quotation', icon: 'FilePen' },
  'quotation.status_changed': { category: 'quotation', severity: 'info', entityType: 'quotation', icon: 'FileCheck' },
  'quotation.deleted': { category: 'quotation', severity: 'important', entityType: 'quotation', icon: 'Trash2' },
  'quotation.converted': { category: 'quotation', severity: 'important', entityType: 'quotation', icon: 'ArrowRightLeft' },

  // Team ---------------------------------------------------------------------
  'team.member_invited': { category: 'team', severity: 'important', entityType: 'business_user', icon: 'UserPlus' },
  'team.member_activated': { category: 'team', severity: 'important', entityType: 'business_user', icon: 'UserCheck' },
  'team.member_deactivated': { category: 'team', severity: 'important', entityType: 'business_user', icon: 'UserMinus' },
  'team.member_removed': { category: 'team', severity: 'critical', entityType: 'business_user', icon: 'UserX' },

  // Settings -----------------------------------------------------------------
  'settings.company_profile_updated': { category: 'settings', severity: 'info', entityType: 'setting', icon: 'Building2' },
  'settings.brand_name_changed': { category: 'settings', severity: 'info', entityType: 'setting', icon: 'Palette' },
  'settings.theme_colors_changed': { category: 'settings', severity: 'info', entityType: 'setting', icon: 'Palette' },
  'settings.logo_uploaded': { category: 'settings', severity: 'info', entityType: 'setting', icon: 'ImagePlus' },
  'settings.logo_removed': { category: 'settings', severity: 'info', entityType: 'setting', icon: 'ImageOff' },
  'settings.quotation_prefix_changed': { category: 'settings', severity: 'important', entityType: 'setting', icon: 'Hash' },
  'settings.payment_settings_updated': { category: 'settings', severity: 'important', entityType: 'setting', icon: 'Wallet' },
  'settings.wallet_alerts_updated': { category: 'settings', severity: 'info', entityType: 'setting', icon: 'Bell' },
  'settings.domain_added': { category: 'settings', severity: 'important', entityType: 'domain', icon: 'Globe' },
  'settings.domain_verified': { category: 'settings', severity: 'important', entityType: 'domain', icon: 'GlobeLock' },
  'settings.domain_verification_failed': { category: 'settings', severity: 'important', entityType: 'domain', icon: 'GlobeLock' },
  'settings.domain_removed': { category: 'settings', severity: 'important', entityType: 'domain', icon: 'Globe' },
  'settings.subdomain_changed': { category: 'settings', severity: 'critical', entityType: 'domain', icon: 'Globe' },

  // Security -----------------------------------------------------------------
  'security.login_succeeded': { category: 'security', severity: 'info', entityType: 'session', icon: 'LogIn' },
  'security.login_failed': { category: 'security', severity: 'important', entityType: 'session', icon: 'ShieldAlert' },
  'security.login_blocked': { category: 'security', severity: 'critical', entityType: 'session', icon: 'ShieldX' },
  'security.logout': { category: 'security', severity: 'info', entityType: 'session', icon: 'LogOut' },
  'security.password_changed': { category: 'security', severity: 'critical', entityType: 'business_user', icon: 'KeyRound' },
  'security.password_reset_requested': { category: 'security', severity: 'important', entityType: 'business_user', icon: 'KeyRound' },
  'security.password_reset_completed': { category: 'security', severity: 'critical', entityType: 'business_user', icon: 'KeyRound' },
  'security.display_name_changed': { category: 'security', severity: 'info', entityType: 'business_user', icon: 'UserCog' },
  'security.avatar_changed': { category: 'security', severity: 'info', entityType: 'business_user', icon: 'UserCog' },

  // Account lifecycle --------------------------------------------------------
  'account.registered': { category: 'account', severity: 'important', entityType: 'account', icon: 'Building2' },
  'account.approved': { category: 'account', severity: 'critical', entityType: 'account', icon: 'BadgeCheck' },
  'account.rejected': { category: 'account', severity: 'critical', entityType: 'account', icon: 'BadgeX' },
  'account.suspended': { category: 'account', severity: 'critical', entityType: 'account', icon: 'Ban' },
  'account.reactivated': { category: 'account', severity: 'critical', entityType: 'account', icon: 'BadgeCheck' },
  // Exporting or clearing the audit log is itself a data movement event and
  // belongs in the audit log. activity.purged is written by the purge function
  // itself and always survives its own cutoff.
  'activity.purged': { category: 'account', severity: 'critical', entityType: 'account', icon: 'Eraser' },

  // Documents ----------------------------------------------------------------
  'document.statement_generated': { category: 'document', severity: 'info', entityType: 'document', icon: 'FileText' },
  'document.transactions_exported': { category: 'document', severity: 'important', entityType: 'document', icon: 'Download' },
  'document.activity_exported': { category: 'document', severity: 'important', entityType: 'document', icon: 'Download' },
} as const satisfies Record<string, ActivityDefinition>;

export type BusinessActivityAction = keyof typeof BUSINESS_ACTIVITY_ACTIONS;

export const ACTIVITY_CATEGORIES: readonly ActivityCategory[] = [
  'wallet', 'booking', 'quotation', 'team', 'settings', 'security', 'account', 'document',
] as const;

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  wallet: 'Wallet',
  booking: 'Bookings',
  quotation: 'Quotations',
  team: 'Team',
  settings: 'Settings',
  security: 'Security',
  account: 'Account',
  document: 'Documents',
};

export const ACTIVITY_CATEGORY_ICONS: Record<ActivityCategory, string> = {
  wallet: 'Wallet',
  booking: 'CalendarCheck',
  quotation: 'FileText',
  team: 'Users',
  settings: 'Settings',
  security: 'ShieldCheck',
  account: 'Building2',
  document: 'Download',
};

export function isKnownActivityAction(action: string): action is BusinessActivityAction {
  return Object.prototype.hasOwnProperty.call(BUSINESS_ACTIVITY_ACTIONS, action);
}

/**
 * Look up a definition for an action that may have come from a newer deploy.
 * Falls back to a safe generic entry rather than throwing, so an unknown action
 * degrades in the UI instead of blanking the feed.
 */
export function getActivityDefinition(action: string): ActivityDefinition {
  if (isKnownActivityAction(action)) {
    return BUSINESS_ACTIVITY_ACTIONS[action];
  }
  const prefix = action.split('.')[0];
  const category = (ACTIVITY_CATEGORIES as readonly string[]).includes(prefix)
    ? (prefix as ActivityCategory)
    : 'account';
  return { category, severity: 'info', icon: ACTIVITY_CATEGORY_ICONS[category] };
}

'use client';

/**
 * Maps an activity action to its icon and tint.
 * SCOPE: Business module ONLY.
 *
 * Tinted by meaning rather than by category alone, so money in and money out
 * read differently at a glance even though both sit under Wallet.
 */

import {
  Activity, ArrowDownCircle, ArrowRightLeft, ArrowUpCircle, BadgeCheck, BadgeX,
  Ban, Bell, BellRing, Building2, CalendarCheck, CalendarClock, CalendarPlus,
  CalendarX, CheckCircle2, CreditCard, Download, Eraser, FileCheck, FilePen,
  FilePlus, FileText, Gauge, Globe, GlobeLock, Hash, ImageOff, ImagePlus,
  KeyRound, LogIn, LogOut, Palette, RefreshCw, Settings, ShieldAlert,
  ShieldCheck, ShieldX, Snowflake, Sun, Trash2, Truck, Undo2, UserCheck,
  UserCog, UserMinus, UserPlus, UserX, Users, Wallet, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getActivityDefinition } from '@/lib/business/activity/catalog';

const ICONS: Record<string, LucideIcon> = {
  Activity, ArrowDownCircle, ArrowRightLeft, ArrowUpCircle, BadgeCheck, BadgeX,
  Ban, Bell, BellRing, Building2, CalendarCheck, CalendarClock, CalendarPlus,
  CalendarX, CheckCircle2, CreditCard, Download, Eraser, FileCheck, FilePen,
  FilePlus, FileText, Gauge, Globe, GlobeLock, Hash, ImageOff, ImagePlus,
  KeyRound, LogIn, LogOut, Palette, RefreshCw, Settings, ShieldAlert,
  ShieldCheck, ShieldX, Snowflake, Sun, Trash2, Truck, Undo2, UserCheck,
  UserCog, UserMinus, UserPlus, UserX, Users, Wallet, XCircle,
};

/** Actions where money comes in, so the tile reads positive. */
const MONEY_IN = new Set([
  'wallet.topup_succeeded',
  'wallet.refunded',
  'wallet.credited_by_admin',
]);

/** Actions that take money, destroy something, or are otherwise dangerous. */
const NEGATIVE = new Set([
  'wallet.debited', 'wallet.debited_by_admin', 'wallet.topup_failed',
  'wallet.payment_rejected', 'wallet.frozen',
  'booking.deleted', 'booking.bulk_deleted', 'booking.cancelled',
  'booking.cancelled_by_admin', 'booking.rejected_by_vendor',
  'quotation.deleted', 'team.member_removed', 'team.member_deactivated',
  'account.suspended', 'account.rejected', 'activity.purged',
  'security.login_failed', 'security.login_blocked',
]);

const PLATFORM_ACTORS = new Set(['admin', 'vendor', 'system']);

export function activityIconFor(action: string): LucideIcon {
  const definition = getActivityDefinition(action);
  return ICONS[definition.icon] ?? Activity;
}

export function activityTintFor(action: string, actorType: string): string {
  if (MONEY_IN.has(action)) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (NEGATIVE.has(action)) return 'bg-red-500/10 text-red-600 dark:text-red-400';
  if (PLATFORM_ACTORS.has(actorType)) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
  return 'bg-primary/10 text-primary';
}

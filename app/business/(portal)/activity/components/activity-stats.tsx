'use client';

/**
 * The four-card summary strip.
 * SCOPE: Business module ONLY.
 *
 * Three of the four cards are filter shortcuts, which turns a decorative strip
 * into navigation. "Needs review" in particular should be one click from cold.
 *
 * Styling mirrors quotations/components/quotation-stats.tsx so the strip is
 * indistinguishable from the one on bookings, wallet and the dashboard.
 */

import { motion } from 'motion/react';
import { Activity, ShieldAlert, Users, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';

export interface ActivityStatsData {
  totalEvents: number;
  truncated: boolean;
  criticalEvents: number;
  moneyIn: number;
  moneyOut: number;
  currency: string;
  countsByCategory: Record<string, number>;
  topActor: { name: string; businessUserId: string | null; count: number } | null;
}

interface ActivityStatsProps {
  stats: ActivityStatsData | null;
  loading: boolean;
  rangeLabel: string;
  formatMoney: (amount: number, currency: string | null) => string;
  onShowCritical: () => void;
  onShowTopActor: (businessUserId: string) => void;
}

interface CardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  /** Value colour. */
  tone: string;
  /** Icon bubble background. */
  bubble: string;
  /** Names are not figures, so they must not get lining numerals. */
  numeric?: boolean;
  onClick?: () => void;
  highlight?: boolean;
}

/**
 * The portal's stat value is text-3xl, which is sized for a bare count. This
 * strip also carries a formatted amount and a person's name, and at 3xl both
 * truncated to "AED 5..." and "vikask...", which is worse than useless on a
 * summary card. Step the size down as the value gets longer instead.
 */
function valueSizeFor(value: string): string {
  if (value.length <= 6) return 'text-3xl';
  if (value.length <= 9) return 'text-2xl';
  if (value.length <= 16) return 'text-xl';
  return 'text-lg';
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone,
  bubble,
  numeric = true,
  onClick,
  highlight,
}: CardProps) {
  const prefersReducedMotion = useReducedMotion();
  const interactive = Boolean(onClick);

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : staggerItem}
      whileHover={prefersReducedMotion || !interactive ? undefined : { y: -2 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full"
    >
      <div
        className={cn(
          'group relative h-full overflow-hidden rounded-xl bg-card p-5 border border-border shadow-sm card-hover transition-all duration-200',
          interactive && 'cursor-pointer hover:shadow-md',
          highlight && 'border-red-500/40'
        )}
        onClick={onClick}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={
          interactive
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') onClick?.();
              }
            : undefined
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                'font-bold tracking-tight',
                valueSizeFor(value),
                // A name wraps rather than truncates: half a person's name
                // identifies nobody.
                numeric ? 'truncate tabular-nums' : 'line-clamp-2 break-words',
                tone
              )}
            >
              {value}
            </p>
            {subtext && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <motion.span
            whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
              bubble
            )}
          >
            <Icon className="h-5 w-5" />
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

export function ActivityStats({
  stats,
  loading,
  rangeLabel,
  formatMoney,
  onShowCritical,
  onShowTopActor,
}: ActivityStatsProps) {
  const prefersReducedMotion = useReducedMotion();
  const net = stats ? stats.moneyIn - stats.moneyOut : 0;

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : staggerContainer}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <StatCard
        label="Events"
        value={loading || !stats ? '-' : `${stats.truncated ? '' : ''}${stats.totalEvents}`}
        subtext={rangeLabel}
        icon={Activity}
        tone="text-foreground"
        bubble="bg-primary/10 dark:bg-primary/20 text-primary"
      />
      <StatCard
        label="Needs review"
        value={loading || !stats ? '-' : String(stats.criticalEvents)}
        subtext={stats && stats.criticalEvents > 0 ? 'Needs attention' : 'Nothing critical'}
        icon={ShieldAlert}
        tone={
          stats && stats.criticalEvents > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-foreground'
        }
        bubble="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400"
        onClick={onShowCritical}
        highlight={Boolean(stats && stats.criticalEvents > 0)}
      />
      <StatCard
        label="Money moved"
        value={loading || !stats ? '-' : formatMoney(Math.abs(net), stats.currency)}
        subtext={
          stats
            ? `In ${formatMoney(stats.moneyIn, stats.currency)} - Out ${formatMoney(stats.moneyOut, stats.currency)}`
            : undefined
        }
        icon={Wallet}
        tone="text-emerald-600 dark:text-emerald-400"
        bubble="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        label="Most active"
        value={loading || !stats ? '-' : stats.topActor?.name ?? 'Nobody yet'}
        subtext={stats?.topActor ? `${stats.topActor.count} actions` : undefined}
        icon={Users}
        tone="text-foreground"
        bubble="bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400"
        // A person's name, not a figure: lining numerals would be wrong here.
        numeric={false}
        onClick={
          stats?.topActor?.businessUserId
            ? () => onShowTopActor(stats.topActor!.businessUserId as string)
            : undefined
        }
      />
    </motion.div>
  );
}

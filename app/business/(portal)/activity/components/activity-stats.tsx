'use client';

/**
 * The four-card summary strip.
 * SCOPE: Business module ONLY.
 *
 * Three of the four cards are filter shortcuts, which turns a decorative strip
 * into navigation. "Needs review" in particular should be one click from cold.
 */

import { motion } from 'motion/react';
import { Activity, ShieldAlert, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  icon: typeof Activity;
  tint: string;
  onClick?: () => void;
  highlight?: boolean;
}

function StatCard({ label, value, subtext, icon: Icon, tint, onClick, highlight }: CardProps) {
  const prefersReducedMotion = useReducedMotion();
  const interactive = Boolean(onClick);

  return (
    <motion.div
      whileHover={prefersReducedMotion || !interactive ? undefined : { y: -2 }}
      className={cn(
        'rounded-xl border border-border bg-muted/30 p-4',
        interactive && 'cursor-pointer hover:border-border/80',
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
          {subtext && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', tint)}>
          <Icon className="h-4 w-4" />
        </span>
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
  const net = stats ? stats.moneyIn - stats.moneyOut : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Events"
        value={loading || !stats ? '-' : `${stats.truncated ? '' : ''}${stats.totalEvents}`}
        subtext={rangeLabel}
        icon={Activity}
        tint="bg-primary/10 text-primary"
      />
      <StatCard
        label="Needs review"
        value={loading || !stats ? '-' : String(stats.criticalEvents)}
        subtext={stats && stats.criticalEvents > 0 ? 'Needs attention' : 'Nothing critical'}
        icon={ShieldAlert}
        tint="bg-red-500/10 text-red-600 dark:text-red-400"
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
        tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        label="Most active"
        value={loading || !stats ? '-' : stats.topActor?.name ?? 'Nobody yet'}
        subtext={stats?.topActor ? `${stats.topActor.count} actions` : undefined}
        icon={Users}
        tint="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        onClick={
          stats?.topActor?.businessUserId
            ? () => onShowTopActor(stats.topActor!.businessUserId as string)
            : undefined
        }
      />
    </div>
  );
}

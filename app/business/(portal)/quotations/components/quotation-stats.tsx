'use client';

/**
 * Quotation counters, in the portal's stat-card style.
 *
 * Client-only because the entrance animation is: the counts themselves are resolved on the
 * server and passed in, so nothing here re-queries.
 *
 * Colours deliberately mirror app/business/(portal)/quotations/components/quotation-status-badge.tsx —
 * a status means the same thing whether it is read off a pill or off a counter.
 */

import { motion } from 'motion/react';
import { FileText, Pencil, Send, CheckCircle2, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import type { QuotationStats as Stats } from '@/lib/business/quotations/types';

interface QuotationStatsProps {
  stats: Stats;
}

interface StatCard {
  label: string;
  value: number;
  caption: string;
  icon: LucideIcon;
  /** Value colour. */
  tone: string;
  /** Icon bubble background. */
  bubble: string;
}

export function QuotationStats({ stats }: QuotationStatsProps) {
  const prefersReducedMotion = useReducedMotion();

  const cards: StatCard[] = [
    {
      label: 'Total',
      value: stats.total,
      caption: stats.total > 0 ? 'All quotations' : 'None yet',
      icon: FileText,
      tone: 'text-foreground',
      bubble: 'bg-primary/10 dark:bg-primary/20 text-primary',
    },
    {
      label: 'Draft',
      value: stats.draft,
      caption: stats.draft > 0 ? 'Not sent yet' : 'None open',
      icon: Pencil,
      tone: 'text-foreground',
      bubble: 'bg-muted text-muted-foreground',
    },
    {
      label: 'Sent',
      value: stats.sent,
      caption: stats.sent > 0 ? 'With customer' : 'None waiting',
      icon: Send,
      tone: 'text-amber-600 dark:text-amber-400',
      bubble: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Accepted',
      value: stats.accepted,
      caption: stats.accepted > 0 ? 'Convertible' : 'None yet',
      icon: CheckCircle2,
      tone: 'text-emerald-600 dark:text-emerald-400',
      bubble: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Expired',
      value: stats.expired,
      caption: stats.expired > 0 ? 'Past validity' : 'All in date',
      icon: Clock,
      tone: 'text-orange-600 dark:text-orange-400',
      bubble: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    // 4-up, matching bookings, wallet and the dashboard. A 5-up row made every quotation card
    // narrower than its counterpart on every other portal screen; the fifth counter wraps
    // instead, exactly as the wallet stats page does.
    <motion.div
      variants={prefersReducedMotion ? undefined : staggerContainer}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={prefersReducedMotion ? undefined : staggerItem}
          whileHover={prefersReducedMotion ? undefined : { y: -2 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="h-full"
        >
          <div className="group relative h-full overflow-hidden rounded-xl bg-card p-5 border border-border shadow-sm card-hover hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  {card.label}
                </p>
                <p className={`text-3xl font-bold tracking-tight tabular-nums ${card.tone}`}>
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{card.caption}</p>
              </div>
              <motion.div
                whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.bubble}`}
              >
                <card.icon className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

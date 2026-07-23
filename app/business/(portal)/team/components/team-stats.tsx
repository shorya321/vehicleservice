'use client';

/**
 * Team counters, in the portal's stat-card style.
 *
 * Every counter is derived from the roster the page already fetched — no extra query. Colours
 * mirror the status pills below them, so "Deactivated" means the same thing whether it is read
 * off a counter or off a row.
 */

import { motion } from 'motion/react';
import { Users, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import type { TeamMember } from './team-page-content';

interface TeamStatsProps {
  members: TeamMember[];
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

export function TeamStats({ members }: TeamStatsProps) {
  const prefersReducedMotion = useReducedMotion();

  const owners = members.filter((m) => m.role === 'owner').length;
  const staff = members.filter((m) => m.role !== 'owner');
  const activeStaff = staff.filter((m) => m.is_active).length;
  const deactivated = members.filter((m) => !m.is_active).length;

  const cards: StatCard[] = [
    {
      label: 'Total members',
      value: members.length,
      caption: `${staff.length} staff · ${owners} owner${owners === 1 ? '' : 's'}`,
      icon: Users,
      tone: 'text-foreground',
      bubble: 'bg-primary/10 dark:bg-primary/20 text-primary',
    },
    {
      label: 'Owners',
      value: owners,
      caption: 'Full account access',
      icon: ShieldCheck,
      tone: 'text-foreground',
      bubble: 'bg-primary/10 dark:bg-primary/20 text-primary',
    },
    {
      label: 'Active staff',
      value: activeStaff,
      caption: activeStaff > 0 ? 'Can create bookings' : 'None can sign in',
      icon: UserCheck,
      tone: 'text-emerald-600 dark:text-emerald-400',
      bubble: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Deactivated',
      value: deactivated,
      caption: deactivated > 0 ? 'Cannot sign in' : 'Everyone active',
      icon: UserX,
      tone: deactivated > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground',
      bubble: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    },
  ];

  return (
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
          <div className="group relative h-full overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 card-hover hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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

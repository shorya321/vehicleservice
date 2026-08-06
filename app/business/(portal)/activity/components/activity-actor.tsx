'use client';

/**
 * The avatar or glyph shown beside an activity row.
 * SCOPE: Business module ONLY.
 *
 * Team members get initials. Non-member actors get a glyph tile instead: never
 * invent a face for Stripe, the platform, or a vendor company.
 */

import { Cpu, CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityActorType } from '@/lib/business/activity/types';

interface ActivityActorProps {
  actorType: ActivityActorType;
  actorName: string;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ActivityActorAvatar({ actorType, actorName, className }: ActivityActorProps) {
  const base = cn(
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
    className
  );

  if (actorType === 'business_user' || actorType === 'customer') {
    return (
      <span
        className={cn(base, 'bg-primary/15 text-primary')}
        aria-hidden="true"
      >
        {initials(actorName)}
      </span>
    );
  }

  const Glyph =
    actorType === 'admin' ? ShieldCheck : actorType === 'vendor' ? Truck : Cpu;

  // Stripe is the one system actor worth distinguishing by name.
  const Icon = actorName === 'Stripe' ? CreditCard : Glyph;

  return (
    <span className={cn(base, 'bg-sky-500/15 text-sky-600 dark:text-sky-400')} aria-hidden="true">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

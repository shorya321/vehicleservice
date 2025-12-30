'use client';

/**
 * Quick Actions Card Component
 * 2x2 grid of action links
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Wallet, CalendarCheck, Settings, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/business/ui/card';
import { useReducedMotion } from '@/lib/business/animation/hooks';

// Quick Action configuration with unique colors per action
const quickActionConfig = [
  {
    key: 'createBooking',
    href: '/business/bookings/new',
    icon: Plus,
    label: 'Create Booking',
    description: 'Start a new booking',
    color: 'text-primary',
    bg: 'bg-primary/10',
    hoverBg: 'hover:bg-primary/15',
    borderHover: 'hover:border-primary/40',
  },
  {
    key: 'manageWallet',
    href: '/business/wallet',
    icon: Wallet,
    label: 'Manage Wallet',
    description: 'View balance & add funds',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    hoverBg: 'hover:bg-emerald-500/15',
    borderHover: 'hover:border-emerald-500/40',
  },
  {
    key: 'viewBookings',
    href: '/business/bookings',
    icon: CalendarCheck,
    label: 'View Bookings',
    description: 'All your bookings',
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    hoverBg: 'hover:bg-sky-500/15',
    borderHover: 'hover:border-sky-500/40',
  },
  {
    key: 'settings',
    href: '/business/settings',
    icon: Settings,
    label: 'Settings',
    description: 'Account preferences',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    hoverBg: 'hover:bg-violet-500/15',
    borderHover: 'hover:border-violet-500/40',
  },
];

interface QuickActionCardItemProps {
  config: typeof quickActionConfig[0];
}

function QuickActionCardItem({ config }: QuickActionCardItemProps) {
  const Icon = config.icon;

  return (
    <Link
      href={config.href}
      className={cn(
        'group flex flex-col p-3 rounded-xl',
        'border border-border',
        'bg-card',
        'transition-all duration-200',
        config.hoverBg,
        config.borderHover,
        'hover:shadow-sm hover:-translate-y-0.5'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg mb-2',
        config.bg
      )}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-foreground">
        {config.label}
      </span>

      {/* Description */}
      <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
        {config.description}
      </span>

      {/* Arrow indicator */}
      <ArrowRight className={cn(
        'h-3.5 w-3.5 mt-2 self-end',
        config.color,
        'opacity-0 -translate-x-1',
        'group-hover:opacity-100 group-hover:translate-x-0',
        'transition-all duration-200'
      )} />
    </Link>
  );
}

interface QuickActionsCardProps {
  className?: string;
}

export function QuickActionsCard({ className }: QuickActionsCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
    },
  };

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={className}
    >
      <Card className={cn(
        'relative overflow-hidden group rounded-xl',
        'bg-card',
        'border border-border',
        'shadow-sm',
        'transition-all duration-300',
        'hover:shadow-md card-hover'
      )}>
        <div className="p-5 pb-3 relative z-10">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Quick Actions
          </h3>
        </div>
        <div className="pt-0 pb-4 px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05, delayChildren: 0.1 }
              }
            }}
            className="grid grid-cols-2 gap-3"
          >
            {quickActionConfig.map((config) => (
              <motion.div
                key={config.key}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <QuickActionCardItem config={config} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

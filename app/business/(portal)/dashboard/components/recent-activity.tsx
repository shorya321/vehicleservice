'use client';

/**
 * Recent Activity Component
 * Enhanced activity feed with avatars and animations
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { useReducedMotion } from '@/lib/business/animation/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/business/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface RecentBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  pickup_datetime: string;
  booking_status: string;
  total_price: number;
}

interface RecentActivityProps {
  bookings: RecentBooking[];
  className?: string;
  delay?: number;
}

const statusConfig: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  icon: React.ReactNode;
  label: string;
}> = {
  completed: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Completed',
  },
  pending: {
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    dotColor: 'bg-primary',
    icon: <Clock className="h-3 w-3" />,
    label: 'Pending',
  },
  confirmed: {
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    dotColor: 'bg-sky-500',
    icon: <CalendarCheck className="h-3 w-3" />,
    label: 'Confirmed',
  },
  cancelled: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    dotColor: 'bg-red-500',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Cancelled',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  // Clean semantic palette
  const colors = [
    'from-primary to-primary/80', // Gold
    'from-sky-500 to-sky-600', // Sky
    'from-emerald-500 to-emerald-600', // Emerald
    'from-violet-500 to-violet-600', // Violet
    'from-amber-500 to-amber-600', // Amber
    'from-slate-500 to-slate-600', // Slate
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function RecentActivity({
  bookings,
  className,
  delay = 0,
}: RecentActivityProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Card className={cn(
        'relative overflow-hidden group rounded-xl',
        'bg-card',
        'border border-border',
        'shadow-sm',
        'transition-all duration-300',
        'hover:shadow-md card-hover',
        className
      )}>
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between p-5 border-b border-border">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Activity
            </CardTitle>
            <CardDescription className="text-sm mt-1 text-muted-foreground">
              Latest bookings and updates
            </CardDescription>
          </div>
          {bookings.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-foreground hover:bg-muted">
              <Link href="/business/bookings">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </CardHeader>

        {/* Activity List */}
        <CardContent className="p-0">
          {bookings.length === 0 ? (
            <EmptyActivityState />
          ) : (
            <div className="relative pl-2">
              {bookings.map((booking, index) => (
                <ActivityItem
                  key={booking.id}
                  booking={booking}
                  index={index}
                  isLast={index === bookings.length - 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ActivityItemProps {
  booking: RecentBooking;
  index: number;
  isLast: boolean;
}

function ActivityItem({ booking, index, isLast }: ActivityItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const status = statusConfig[booking.booking_status.toLowerCase()] || statusConfig.pending;

  const formattedDate = new Date(booking.pickup_datetime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = new Date(booking.pickup_datetime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative"
    >
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-[18px] top-[44px] bottom-0 w-0.5 bg-border" />
      )}

      <Link
        href={`/business/bookings/${booking.id}`}
        className="group flex items-start gap-4 p-4 pr-5 transition-all duration-200 hover:bg-muted/50 rounded-lg"
      >
        {/* Timeline dot - colored by status */}
        <div className="relative flex-shrink-0 mt-1.5">
          <div className={cn(
            "h-3 w-3 rounded-full ring-4 ring-card",
            status.dotColor
          )} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
              {booking.customer_name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                status.bgColor,
                status.color,
                status.borderColor
              )}
            >
              {status.icon}
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            {booking.booking_number}
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            {formattedDate} at {formattedTime}
          </p>
        </div>

        {/* Price & Arrow */}
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-sm font-bold text-primary">
            {formatCurrency(booking.total_price)}
          </span>
          <ArrowRight
            className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
          />
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyActivityState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Larger, more prominent icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl mb-6 bg-primary/10">
        <CalendarCheck className="h-8 w-8 text-primary" />
      </div>

      {/* Clear heading */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No activity yet
      </h3>

      {/* Helpful description */}
      <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
        Create your first booking to see activity here. It only takes a moment to get started.
      </p>

      {/* Primary action button */}
      <Button
        asChild
        className="gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <Link href="/business/bookings/new">
          <Plus className="h-4 w-4" />
          Create First Booking
        </Link>
      </Button>
    </div>
  );
}

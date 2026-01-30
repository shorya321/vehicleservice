'use client';

/**
 * Mobile-friendly Booking Card Component
 * Clean shadcn design with gold accent
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { motion } from 'motion/react';
import { Calendar, Clock, Car, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  pickup_datetime: string;
  booking_status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  total_price: number;
  from_locations: { name: string; city: string };
  to_locations: { name: string; city: string };
  vehicle_types: { name: string };
  created_at: string;
}

interface BookingCardProps {
  booking: Booking;
  className?: string;
  index?: number;
}

// Map database status to UI status
function mapBookingStatus(status: string): 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' {
  const statusMap: Record<string, 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'> = {
    pending: 'pending',
    confirmed: 'confirmed',
    assigned: 'confirmed',
    in_progress: 'in-progress',
    completed: 'completed',
    cancelled: 'cancelled',
    refunded: 'cancelled',
  };
  return statusMap[status] || 'pending';
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Get avatar gradient based on name - semantic palette
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-primary to-primary/80', // Gold
    'from-sky-500 to-sky-600', // Sky
    'from-emerald-500 to-emerald-600', // Emerald
    'from-violet-500 to-violet-600', // Violet
    'from-amber-500 to-amber-600', // Amber
    'from-slate-500 to-slate-600', // Slate
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

// Status badge helper - semantic colors
const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  },
};

export function BookingCard({ booking, className, index = 0 }: BookingCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const pickupDate = new Date(booking.pickup_datetime);
  const formattedDate = pickupDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = pickupDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const status = statusConfig[mapBookingStatus(booking.booking_status)] || statusConfig.pending;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link
        href={`/business/bookings/${booking.id}`}
        className={cn('block', className)}
      >
        <Card className={cn(
          'relative overflow-hidden group rounded-xl',
          'bg-card',
          'border border-border',
          'shadow-sm',
          'transition-all duration-300 ease-out',
          'hover:shadow-md'
        )}>
          <CardContent className="p-5">
            {/* Header: Avatar, Customer Info & Status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Gradient Avatar */}
                <Avatar className="h-11 w-11 rounded-xl ring-2 ring-border group-hover:ring-primary/30 transition-all duration-300">
                  <AvatarFallback
                    className={cn(
                      'rounded-xl text-primary-foreground font-semibold text-sm bg-gradient-to-br',
                      getAvatarGradient(booking.customer_name)
                    )}
                  >
                    {getInitials(booking.customer_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {booking.customer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {booking.booking_number}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn('text-xs rounded-full px-2.5 py-0.5', status.className)}>
                {status.label}
              </Badge>
            </div>

            {/* Route Visualization */}
            <div className="relative pl-4 mb-4">
              {/* Gradient line - gold */}
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gradient-to-b from-primary to-primary/30" />
              <div className="space-y-3">
                {/* Pickup */}
                <div className="flex items-center gap-3">
                  <div className="relative w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-sm text-foreground truncate">
                    {booking.from_locations.name}
                  </span>
                </div>
                {/* Dropoff */}
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
                  <span className="text-sm text-muted-foreground truncate">
                    {booking.to_locations.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary/50" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary/50" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-primary/50" />
                <span>{booking.vehicle_types.name}</span>
              </div>
            </div>

            {/* Footer: Price & Arrow */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-lg font-bold text-primary">
                {formatCurrency(booking.total_price)}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                <span className="text-xs">View Details</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// List component for displaying multiple cards
interface BookingCardListProps {
  bookings: Booking[];
  className?: string;
}

export function BookingCardList({ bookings, className }: BookingCardListProps) {
  if (!bookings || bookings.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {bookings.map((booking, index) => (
        <BookingCard key={booking.id} booking={booking} index={index} />
      ))}
    </div>
  );
}

'use client';

/**
 * Bookings Page Content
 * Clean shadcn design with gold accent
 *
 * Design System: Clean shadcn with Gold Accent
 * SCOPE: Business module ONLY
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  CalendarCheck,
  Search,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  MapPin,
  ChevronRight,
  Eye,
  Filter,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReducedMotion } from '@/lib/business/animation/hooks';

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  pickup_datetime: string;
  booking_status: string;
  total_price: number;
  from_locations: { name: string; city: string } | null;
  to_locations: { name: string; city: string } | null;
  vehicle_types: { name: string } | null;
  created_at: string;
}

interface BookingsPageContentProps {
  bookings: Booking[];
  totalCount: number;
  pendingCount: number;
}

// Map booking status to UI status
function mapBookingStatus(
  status: string
): 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' {
  const statusMap: Record<
    string,
    'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  > = {
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

// Generate sample sparkline data
function generateSparklineData(value: number, points: number = 7): number[] {
  const data: number[] = [];
  let current = value * 0.6;
  for (let i = 0; i < points; i++) {
    const variation = (Math.random() - 0.3) * (value * 0.2);
    current = Math.max(0, current + variation);
    data.push(Math.round(current));
  }
  data[data.length - 1] = value;
  return data;
}

export function BookingsPageContent({
  bookings,
  totalCount,
  pendingCount,
}: BookingsPageContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculate stats
  const completedCount = bookings.filter(
    (b) => b.booking_status === 'completed'
  ).length;
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.booking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || booking.booking_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Generate sparkline data
  const bookingsSparkline = generateSparklineData(totalCount || 5);
  const revenueSparkline = generateSparklineData(totalRevenue / 100 || 50);
  const pendingSparkline = generateSparklineData(pendingCount || 2);

  // Refined animations - faster, subtler
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  // Row animation - pure fade, no movement
  const rowVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { duration: 0.2, delay: i * 0.03 },
    }),
  };

  return (
    <div className="pb-12 space-y-6">
      {/* Header Section */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            Bookings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your bookings
          </p>
        </div>
      </motion.div>

      {/* Stats Row - Obsidian Luxury Cards */}
      <motion.div
        variants={prefersReducedMotion ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Total Bookings */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Bookings</span>
              <p className="text-3xl font-bold text-primary mt-2">{totalCount}</p>
              {totalCount > 0 && (
                <Badge variant="outline" className="mt-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 rounded-full">
                  ↑ 12%
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Revenue</span>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending */}
        <motion.div variants={prefersReducedMotion ? undefined : itemVariants}>
          <Card className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pending</span>
              <p className="text-3xl font-bold text-sky-600 dark:text-sky-400 mt-2">{pendingCount}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
          />
        </div>

        {/* Status Filter Dropdown */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-muted border-border text-muted-foreground">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                All Status
              </span>
            </SelectItem>
            <SelectItem value="pending" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Pending
              </span>
            </SelectItem>
            <SelectItem value="confirmed" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Confirmed
              </span>
            </SelectItem>
            <SelectItem value="completed" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Completed
              </span>
            </SelectItem>
            <SelectItem value="cancelled" className="text-muted-foreground focus:bg-primary/10 focus:text-foreground">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Cancelled
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Button variant="outline" className="hidden sm:flex items-center gap-2 bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          Last 30 days
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>

        {/* New Booking Button */}
        <Button asChild className="ml-auto gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
          <Link href="/business/bookings/new">
            <Plus className="h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="bg-card border border-border rounded-xl shadow-sm">
          <div>
            {filteredBookings.length === 0 ? (
              <EmptyBookingsState hasFilter={searchQuery !== '' || statusFilter !== 'all'} />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  {/* Table Header */}
                  <div className="bg-muted/50 border-b border-border">
                    <div className="grid grid-cols-[1fr,1fr,1.5fr,100px,100px,40px] px-5 py-3">
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Date
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Customer
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Route
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                        Status
                      </span>
                      <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground text-right">
                        Amount
                      </span>
                      <span></span>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-border">
                    {filteredBookings.map((booking, index) => (
                      <TableRow
                        key={booking.id}
                        booking={booking}
                        index={index}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    ))}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 space-y-3">
                  {filteredBookings.map((booking, index) => (
                    <MobileBookingCard
                      key={booking.id}
                      booking={booking}
                      index={index}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// Desktop Table Row - Clean, minimal
interface TableRowProps {
  booking: Booking;
  index: number;
  prefersReducedMotion: boolean;
}

function TableRow({ booking, index, prefersReducedMotion }: TableRowProps) {
  const pickupDate = new Date(booking.pickup_datetime);
  const formattedDate = pickupDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = pickupDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <motion.div
      custom={index}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link
        href={`/business/bookings/${booking.id}`}
        className="group grid grid-cols-[1fr,1fr,1.5fr,100px,100px,40px] px-5 py-4 items-center hover:bg-muted/50 border-l-2 border-transparent hover:border-l-primary transition-all duration-150"
      >
        {/* Date */}
        <div>
          <p className="text-sm font-medium text-foreground">
            {formattedDate}
          </p>
          <p className="text-xs text-muted-foreground">
            {formattedTime}
          </p>
        </div>

        {/* Customer */}
        <div>
          <p className="text-sm text-foreground group-hover:text-primary transition-colors">
            {booking.customer_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {booking.booking_number}
          </p>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="truncate max-w-[120px]">
            {booking.from_locations?.name || 'N/A'}
          </span>
          <ArrowRight className="h-3 w-3 text-primary/50 flex-shrink-0" />
          <span className="truncate max-w-[120px]">
            {booking.to_locations?.name || 'N/A'}
          </span>
        </div>

        {/* Status */}
        <StatusBadge status={mapBookingStatus(booking.booking_status)} />

        {/* Amount */}
        <span className="text-sm font-bold text-primary text-right">
          {formatCurrency(booking.total_price)}
        </span>

        {/* View Icon */}
        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors justify-self-end" />
      </Link>
    </motion.div>
  );
}

// Status Badge component for table
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    pending: {
      label: 'Pending',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    confirmed: {
      label: 'Confirmed',
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
    },
    'in-progress': {
      label: 'In Progress',
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
    },
    completed: {
      label: 'Completed',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs rounded-full px-2.5 py-0.5 border',
        config.color,
        config.bgColor,
        config.borderColor
      )}
    >
      {config.label}
    </Badge>
  );
}

// Mobile Card
interface MobileBookingCardProps {
  booking: Booking;
  index: number;
  prefersReducedMotion: boolean;
}

function MobileBookingCard({
  booking,
  index,
  prefersReducedMotion,
}: MobileBookingCardProps) {
  const pickupDate = new Date(booking.pickup_datetime);
  const formattedDateTime = pickupDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link href={`/business/bookings/${booking.id}`} className="block group">
        <Card className="bg-card border border-border rounded-xl active:bg-muted/50 transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            {/* Header: Status + Date */}
            <div className="flex items-center justify-between mb-3">
              <StatusBadge status={mapBookingStatus(booking.booking_status)} />
              <span className="text-xs text-muted-foreground">
                {formattedDateTime}
              </span>
            </div>

            {/* Customer */}
            <div className="mb-3">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {booking.customer_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {booking.booking_number}
              </p>
            </div>

            {/* Route */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="truncate">{booking.from_locations?.name || 'N/A'}</span>
              <ArrowRight className="h-3 w-3 text-primary/50 flex-shrink-0" />
              <span className="truncate">{booking.to_locations?.name || 'N/A'}</span>
            </div>

            {/* Footer: Price */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-lg font-bold text-primary">
                {formatCurrency(booking.total_price)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

// Empty state component
function EmptyBookingsState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl mb-4 bg-primary/10">
        <CalendarCheck className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">
        {hasFilter ? 'No matching bookings' : 'No bookings yet'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {hasFilter
          ? "Try adjusting your search or filters to find what you're looking for"
          : 'Create your first booking to start managing your transfers'}
      </p>
      {!hasFilter && (
        <Button
          asChild
          className="gap-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
        >
          <Link href="/business/bookings/new">
            <Plus className="h-4 w-4" />
            Create Your First Booking
          </Link>
        </Button>
      )}
    </div>
  );
}

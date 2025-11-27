'use client';

/**
 * Bookings Page Content Component
 * Client component with luxury styling and animations
 *
 * Design System: Premium B2B experience with refined luxury aesthetic
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  CalendarCheck,
  Clock,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Sparkles,
  MapPin,
  Car,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business/wallet-operations';
import {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardTitle,
  LuxuryCardDescription,
  LuxuryCardContent,
  LuxuryTable,
  LuxuryTableHeader,
  LuxuryTableBody,
  LuxuryTableRow,
  LuxuryTableHead,
  LuxuryTableCell,
  LuxuryTableEmpty,
  LuxuryButton,
  LuxuryInput,
  StatusBadge,
  HeroStatCard,
} from '@/components/business/ui';
import { FadeIn } from '@/components/business/motion';
import { staggerContainer, staggerItem } from '@/lib/business/animation/variants';
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

export function BookingsPageContent({
  bookings,
  totalCount,
  pendingCount,
}: BookingsPageContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const getStatusVariant = (
    status: string
  ): 'success' | 'warning' | 'info' | 'default' | 'destructive' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'assigned':
      case 'in_progress':
        return 'info';
      case 'cancelled':
      case 'refunded':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--business-font-display)] text-3xl sm:text-4xl font-semibold text-[var(--business-text-primary)] tracking-tight">
              Bookings
            </h1>
            <p className="mt-1 text-[var(--business-text-muted)] font-[family-name:var(--business-font-body)]">
              View and manage your transfer bookings
            </p>
          </div>
          <LuxuryButton asChild variant="primary" className="gap-2">
            <Link href="/business/bookings/new">
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </LuxuryButton>
        </div>
      </FadeIn>

      {/* Stats Row */}
      <motion.div
        variants={prefersReducedMotion ? undefined : staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div variants={prefersReducedMotion ? undefined : staggerItem}>
          <HeroStatCard
            title="Total Bookings"
            value={totalCount}
            subtitle="All time"
            icon={<CalendarCheck className="h-5 w-5" />}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : staggerItem}>
          <HeroStatCard
            title="Pending"
            value={pendingCount}
            subtitle="Awaiting assignment"
            icon={<Clock className="h-5 w-5" />}
            variant={pendingCount > 0 ? 'warning' : 'default'}
          />
        </motion.div>
        <motion.div variants={prefersReducedMotion ? undefined : staggerItem}>
          <HeroStatCard
            title="This Month"
            value={bookings.filter((b) => {
              const date = new Date(b.created_at);
              const now = new Date();
              return (
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
              );
            }).length}
            subtitle="Bookings created"
            icon={<CalendarCheck className="h-5 w-5" />}
          />
        </motion.div>
      </motion.div>

      {/* Filters and Search */}
      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--business-text-muted)]" />
            <LuxuryInput
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(
              (status) => (
                <LuxuryButton
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status === 'all' ? 'All' : status}
                </LuxuryButton>
              )
            )}
          </div>
        </div>
      </FadeIn>

      {/* Bookings Table */}
      <FadeIn delay={0.2}>
        <LuxuryCard>
          <LuxuryCardHeader>
            <LuxuryCardTitle>All Bookings</LuxuryCardTitle>
            <LuxuryCardDescription>
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
            </LuxuryCardDescription>
          </LuxuryCardHeader>
          <LuxuryCardContent className="p-0">
            {filteredBookings.length === 0 ? (
              <EmptyBookingsState hasFilter={searchQuery !== '' || statusFilter !== 'all'} />
            ) : (
              <LuxuryTable>
                <LuxuryTableHeader>
                  <LuxuryTableRow>
                    <LuxuryTableHead>Booking</LuxuryTableHead>
                    <LuxuryTableHead>Customer</LuxuryTableHead>
                    <LuxuryTableHead>Route</LuxuryTableHead>
                    <LuxuryTableHead>Pickup</LuxuryTableHead>
                    <LuxuryTableHead>Status</LuxuryTableHead>
                    <LuxuryTableHead className="text-right">Amount</LuxuryTableHead>
                    <LuxuryTableHead className="text-right">Actions</LuxuryTableHead>
                  </LuxuryTableRow>
                </LuxuryTableHeader>
                <LuxuryTableBody>
                  {filteredBookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        'border-b border-[var(--business-border-subtle)] last:border-0',
                        'transition-colors duration-200',
                        'hover:bg-[var(--business-primary-500)]/5'
                      )}
                    >
                      <LuxuryTableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--business-surface-2)] text-[var(--business-primary-400)]">
                            <CalendarCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--business-text-primary)]">
                              {booking.booking_number}
                            </p>
                            {booking.vehicle_types && (
                              <p className="text-xs text-[var(--business-text-muted)] flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {booking.vehicle_types.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </LuxuryTableCell>
                      <LuxuryTableCell>
                        <div>
                          <p className="font-medium text-[var(--business-text-primary)]">
                            {booking.customer_name}
                          </p>
                          <p className="text-xs text-[var(--business-text-muted)]">
                            {booking.customer_email}
                          </p>
                        </div>
                      </LuxuryTableCell>
                      <LuxuryTableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-[var(--business-text-secondary)]">
                            <MapPin className="h-3 w-3 text-[var(--business-primary-400)]" />
                            {booking.from_locations?.name || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1 text-[var(--business-text-muted)] mt-0.5">
                            <ArrowRight className="h-3 w-3" />
                            {booking.to_locations?.name || 'N/A'}
                          </div>
                        </div>
                      </LuxuryTableCell>
                      <LuxuryTableCell>
                        <div className="text-sm">
                          <p className="text-[var(--business-text-secondary)]">
                            {new Date(booking.pickup_datetime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-[var(--business-text-muted)]">
                            {new Date(booking.pickup_datetime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </LuxuryTableCell>
                      <LuxuryTableCell>
                        <StatusBadge variant={getStatusVariant(booking.booking_status)}>
                          {formatStatus(booking.booking_status)}
                        </StatusBadge>
                      </LuxuryTableCell>
                      <LuxuryTableCell className="text-right">
                        <span className="font-medium text-[var(--business-text-primary)]">
                          {formatCurrency(booking.total_price)}
                        </span>
                      </LuxuryTableCell>
                      <LuxuryTableCell className="text-right">
                        <LuxuryButton asChild variant="ghost" size="sm">
                          <Link href={`/business/bookings/${booking.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </LuxuryButton>
                      </LuxuryTableCell>
                    </motion.tr>
                  ))}
                </LuxuryTableBody>
              </LuxuryTable>
            )}
          </LuxuryCardContent>
        </LuxuryCard>
      </FadeIn>
    </div>
  );
}

// Empty state component
function EmptyBookingsState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--business-primary-500)]/10">
          <CalendarCheck className="h-8 w-8 text-[var(--business-primary-400)]" />
        </div>
        {!hasFilter && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -right-1 -top-1"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--business-primary-500)]">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </motion.div>
        )}
      </div>
      <h3 className="mb-2 text-lg font-medium text-[var(--business-text-primary)] font-[family-name:var(--business-font-display)]">
        {hasFilter ? 'No matching bookings' : 'No bookings yet'}
      </h3>
      <p className="mb-6 text-sm text-[var(--business-text-muted)] max-w-sm font-[family-name:var(--business-font-body)]">
        {hasFilter
          ? 'Try adjusting your search or filters to find what you\'re looking for'
          : 'Create your first booking to start managing your transfers with ease'}
      </p>
      {!hasFilter && (
        <LuxuryButton asChild variant="primary">
          <Link href="/business/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Booking
          </Link>
        </LuxuryButton>
      )}
    </div>
  );
}
